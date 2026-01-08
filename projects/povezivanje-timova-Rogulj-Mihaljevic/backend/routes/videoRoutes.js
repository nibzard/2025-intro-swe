const express = require('express');
const router = express.Router();

const {
  uploadVideo: uploadVideoController,
  getVideos,
  getVideo,
  streamVideo,
  likeVideo,
  addComment,
  deleteVideo
} = require('../controllers/videoController');

const auth = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/ratelimiter');
const { uploadVideo, checkStorageLimit } = require('../middleware/upload');

// UPLOAD VIDEO
router.post(
  '/upload',
  auth,
  uploadLimiter,
  checkStorageLimit,
  uploadVideo.single('video'), // Multer middleware za upload
  uploadVideoController // tvoja funkcija iz videoController
);

// Ostale rute
router.get('/', getVideos);
router.get('/:videoId', getVideo);
router.get('/:videoId/stream', streamVideo);
router.post('/:videoId/like', auth, likeVideo);
router.post('/:videoId/comment', auth, addComment);
router.delete('/:videoId', auth, deleteVideo);

module.exports = router;
