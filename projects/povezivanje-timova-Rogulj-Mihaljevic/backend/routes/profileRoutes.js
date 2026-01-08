const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getUserActivity
} = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/:userId', auth, getProfile);
router.put('/', auth, updateProfile);
router.post('/password', auth, changePassword);
router.post('/avatar', auth, uploadAvatar);
router.get('/:userId/activity', auth, getUserActivity);

module.exports = router;