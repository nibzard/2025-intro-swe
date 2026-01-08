const express = require('express');
const router = express.Router();
const {
  uploadVideo,
  getVideos,
  getVideo,
  streamVideo,
  likeVideo,
  addComment,
  deleteVideo
} = require('../controllers/videoController');
const auth = require('../middleware/auth');
const { uploadVideo: videoUpload } = require('../middleware/upload'); // ← PROMJENA
const { uploadLimiter } = require('../middleware/ratelimiter');

router.post('/upload', auth, uploadLimiter, uploadVideo.single('video'), uploadVideoController); // NOVO
router.post('/upload', auth, videoUpload.single('video'), uploadVideo);
router.get('/', getVideos);
router.get('/:videoId', getVideo);
router.get('/:videoId/stream', streamVideo);
router.post('/:videoId/like', auth, likeVideo);
router.post('/:videoId/comment', auth, addComment);
router.delete('/:videoId', auth, deleteVideo);

module.exports = router;