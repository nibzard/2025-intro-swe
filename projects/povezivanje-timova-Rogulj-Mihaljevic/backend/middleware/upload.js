const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Kreiraj direktorije ako ne postoje
const uploadDirs = {
  videos: './uploads/videos',
  images: './uploads/images',
  fields: './uploads/fields',
  temp: './uploads/temp'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper funkcija za čišćenje starih fileova
const cleanupOldFiles = (directory, maxAgeInDays = 30) => {
  const files = fs.readdirSync(directory);
  const now = Date.now();
  const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Obrisan stari file: ${file}`);
    }
  });
};

// Pokreni cleanup svaki dan
setInterval(() => {
  cleanupOldFiles(uploadDirs.temp, 1); // Temp files nakon 1 dan
  cleanupOldFiles(uploadDirs.images, 90); // Images nakon 90 dana (nekorištene)
}, 24 * 60 * 60 * 1000);

// Video storage configuration
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirs.videos);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Image storage sa compression
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirs.temp); // Prvo u temp, pa compression
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Field image storage
const fieldImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirs.temp);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'field-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File type filters
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Samo video formati su dozvoljeni (mp4, mov, avi, mkv, webm)!'));
  }
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Samo image formati su dozvoljeni (jpeg, jpg, png, gif, webp)!'));
  }
};

// Storage limit checker middleware
const checkStorageLimit = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const Video = require('../models/Video');
    
    const userId = req.user.id;
    
    // Dohvati total storage user-a
    const videos = await Video.find({ author: userId });
    const totalStorage = videos.reduce((sum, video) => sum + (video.fileSize || 0), 0);
    
    // Free users: 500MB limit
    // Premium users: 5GB limit (implementirat ćemo kasnije)
    const storageLimit = 500 * 1024 * 1024; // 500MB u bytes
    
    if (totalStorage >= storageLimit) {
      return res.status(403).json({ 
        message: 'Dostignut storage limit! Obriši stare videe ili upgrade na premium.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Storage limit check error:', error);
    next();
  }
};

// Image compression middleware
const compressImage = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  try {
    const files = req.files || [req.file];
    const compressedFiles = [];

    for (const file of files) {
      const tempPath = file.path;
      const finalDir = file.fieldname === 'images' ? uploadDirs.fields : uploadDirs.images;
      const finalPath = path.join(finalDir, file.filename.replace(path.extname(file.filename), '.jpg'));

      // Compress i resize image
      await sharp(tempPath)
        .resize(1920, 1080, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 80, 
          progressive: true 
        })
        .toFile(finalPath);

      // Obriši temp file
      fs.unlinkSync(tempPath);

      // Update file info
      file.path = finalPath;
      file.filename = path.basename(finalPath);
      file.size = fs.statSync(finalPath).size;

      compressedFiles.push(file);
    }

    if (req.files) {
      req.files = compressedFiles;
    } else {
      req.file = compressedFiles[0];
    }

    next();
  } catch (error) {
    console.error('Image compression error:', error);
    next(error);
  }
};

// Upload middlewares
const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  },
  fileFilter: videoFilter
});

const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: imageFilter
});

const uploadFieldImages = multer({
  storage: fieldImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max per image
  },
  fileFilter: imageFilter
});

module.exports = {
  uploadVideo,
  uploadImage,
  uploadFieldImages,
  compressImage,
  checkStorageLimit,
  cleanupOldFiles
};