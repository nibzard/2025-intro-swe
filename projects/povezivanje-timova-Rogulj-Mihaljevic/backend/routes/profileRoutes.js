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
const { updateProfileValidator, mongoIdValidator } = require('../middleware/validators'); // NOVO

router.put('/', auth, updateProfileValidator, updateProfile); // DODAJ validator
router.get('/:userId', mongoIdValidator, getProfile); // DODAJ validator
module.exports = router;