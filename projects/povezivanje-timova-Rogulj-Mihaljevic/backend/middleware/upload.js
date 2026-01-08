const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Kreiraj direktorije ako ne postoje
const uploadDirs = {
  videos: './uploads/videos',
  images: './uploads/images',
  fields: './uploads/fields'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage za videe
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirs.videos);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage za slike
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirs.images);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage za field slike
const fieldImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirs.fields);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'field-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filters
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
  uploadFieldImages
};