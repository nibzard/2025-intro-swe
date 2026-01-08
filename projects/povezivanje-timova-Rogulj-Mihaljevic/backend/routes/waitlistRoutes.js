const express = require('express');
const router = express.Router();
const { joinWaitlist, leaveWaitlist } = require('../controllers/waitlistController');
const auth = require('../middleware/auth');

router.post('/:teamId/join', auth, joinWaitlist);
router.post('/:teamId/leave', auth, leaveWaitlist);

module.exports = router;