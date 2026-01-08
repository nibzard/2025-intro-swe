const express = require('express');
const router = express.Router();
const {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
} = require('../controllers/friendsController');
const auth = require('../middleware/auth');

router.get('/search', auth, searchUsers);
router.post('/request/:userId', auth, sendFriendRequest);
router.get('/requests', auth, getFriendRequests);
router.post('/accept/:requestId', auth, acceptFriendRequest);
router.post('/reject/:requestId', auth, rejectFriendRequest);
router.get('/', auth, getFriends);
router.delete('/:friendId', auth, removeFriend);

module.exports = router;