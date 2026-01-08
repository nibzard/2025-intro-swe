const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getUserRating,
  recalculateRating,
  getAchievements
} = require('../controllers/ratingController');
const auth = require('../middleware/auth');

router.get('/leaderboard', getLeaderboard);
router.get('/user/:userId', getUserRating);
router.post('/recalculate', auth, recalculateRating);
router.get('/achievements', auth, getAchievements);

module.exports = router;