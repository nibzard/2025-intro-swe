const Video = require('../models/Video');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { createActivityHelper } = require('./activityController');
const { createNotificationHelper } = require('./notificationController'); // ✅ DODANO

// Upload video
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Video datoteka nije pronađena!' });
    }

    const { title, description, category } = req.body;

    if (!title || !category) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Naslov i kategorija su obavezni!' });
    }

    const video = new Video({
      title,
      description,
      category,
      filename: req.file.filename,
      filepath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      author: req.user.id
    });

    await video.save();
    await video.populate('author', 'username avatar');

    try {
      await createActivityHelper(
        req.user.id,
        'video_uploaded',
        {
          videoId: video._id,
          videoTitle: video.title
        },
        'public'
      );
    } catch (activityErr) {
      console.error('Greška pri kreiranju aktivnosti:', activityErr);
    }

    res.json({ 
      message: 'Video uspješno uploadan!', 
      video 
    });
  } catch (error) {
    console.error('Upload video error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati sve videe
exports.getVideos = async (req, res) => {
  try {
    const { category, search, author } = req.query;
    
    const query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (author) {
      query.author = author;
    }

    const videos = await Video.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati jedan video
exports.getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId)
      .populate('author', 'username avatar')
      .populate('comments.user', 'username avatar');

    if (!video) {
      return res.status(404).json({ message: 'Video ne postoji' });
    }

    video.views += 1;
    await video.save();

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Stream video
exports.streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video ne postoji' });
    }

    const videoPath = video.filepath;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimeType || 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType || 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like video
exports.likeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video ne postoji' });
    }

    const alreadyLiked = video.likes.includes(userId);
    
    if (alreadyLiked) {
      video.likes = video.likes.filter(id => id.toString() !== userId);
    } else {
      video.likes.push(userId);
    }

    await video.save();

    // ✅ NOVO - Notifikacija za autora videa (samo ako nije sam lajkao)
    if (video.author.toString() !== userId && !alreadyLiked) {
      try {
        const liker = await User.findById(userId).select('username');
        
        await createNotificationHelper(
          video.author,
          'video_liked',
          '❤️ Novi like',
          `${liker.username} je lajkao tvoj video "${video.title}"`,
          `/highlights`,
          { videoId: video._id },
          userId
        );
      } catch (notifErr) {
        console.error('Greška pri kreiranju notifikacije:', notifErr);
      }
    }

    res.json({ 
      message: alreadyLiked ? 'Unlike' : 'Like',
      likes: video.likes.length 
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dodaj komentar
exports.addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Komentar ne može biti prazan!' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video ne postoji' });
    }

    video.comments.push({
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    });

    await video.save();
    await video.populate('comments.user', 'username avatar');

    // ✅ NOVO - Notifikacija za autora videa (ako nije sam komentirao)
    if (video.author.toString() !== userId) {
      try {
        const commenter = await User.findById(userId).select('username');
        
        await createNotificationHelper(
          video.author,
          'video_commented',
          '💬 Novi komentar',
          `${commenter.username} je komentirao tvoj video "${video.title}"`,
          `/highlights`,
          { videoId: video._id },
          userId
        );
      } catch (notifErr) {
        console.error('Greška pri kreiranju notifikacije:', notifErr);
      }
    }

    res.json({ 
      message: 'Komentar dodan!',
      comment: video.comments[video.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši video
exports.deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video ne postoji' });
    }

    if (video.author.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo obrisati ovaj video!' });
    }

    if (fs.existsSync(video.filepath)) {
      fs.unlinkSync(video.filepath);
    }

    await Video.findByIdAndDelete(videoId);

    res.json({ message: 'Video obrisan!' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;