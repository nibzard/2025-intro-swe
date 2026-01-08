const express = require('express');
const router = express.Router();
const {
  getMatches,
  getMatch,
  createMatch,
  updateScore,
  addEvent,
  updateStats,
  updateStatus,
  addCommentary,
  deleteMatch
} = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/', getMatches);
router.get('/:matchId', getMatch);
router.post('/', auth, createMatch);
router.put('/:matchId/score', auth, updateScore);
router.post('/:matchId/event', auth, addEvent);
router.put('/:matchId/stats', auth, updateStats);
router.put('/:matchId/status', auth, updateStatus);
router.post('/:matchId/commentary', auth, addCommentary);
router.delete('/:matchId', auth, deleteMatch);

module.exports = router;