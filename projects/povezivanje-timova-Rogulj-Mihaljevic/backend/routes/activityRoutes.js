const express = require('express');
const router = express.Router();
const {
  getActivityFeed,
  getUserActivities,
  createActivity,
  deleteActivity
} = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.get('/feed', auth, getActivityFeed);
router.get('/user/:userId', getUserActivities);
router.post('/', auth, createActivity);
router.delete('/:activityId', auth, deleteActivity);

module.exports = router;