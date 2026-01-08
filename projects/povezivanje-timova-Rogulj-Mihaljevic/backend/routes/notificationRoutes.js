const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.put('/:notificationId/read', auth, markAsRead);
router.put('/read-all', auth, markAllAsRead);
router.delete('/:notificationId', auth, deleteNotification);
router.delete('/', auth, deleteAllNotifications);

module.exports = router;