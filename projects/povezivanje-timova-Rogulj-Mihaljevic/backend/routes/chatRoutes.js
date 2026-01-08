const express = require('express');
const router = express.Router();
const {
  getMessages,
  deleteMessage
} = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.get('/:teamId/messages', auth, getMessages);
router.delete('/:teamId/messages/:messageId', auth, deleteMessage);

module.exports = router;