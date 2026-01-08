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
const upload = require('../middleware/upload');

router.post('/upload', auth, upload.single('video'), uploadVideo);
router.get('/', getVideos);
router.get('/:videoId', getVideo);
router.get('/:videoId/stream', streamVideo);
router.post('/:videoId/like', auth, likeVideo);
router.post('/:videoId/comment', auth, addComment);
router.delete('/:videoId', auth, deleteVideo);

module.exports = router;