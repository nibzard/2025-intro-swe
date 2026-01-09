const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTournaments,
  getTournament,
  createTournament,
  registerTeam,
  unregisterTeam,
  generateBracket,
  updateMatch,
  deleteTournament
} = require('../controllers/tournamentController');

// Public routes
router.get('/', getTournaments);
router.get('/:id', getTournament);

// Protected routes
router.post('/', auth, createTournament);
router.post('/:tournamentId/register', auth, registerTeam);
router.post('/:tournamentId/unregister', auth, unregisterTeam);
router.post('/:tournamentId/generate-bracket', auth, generateBracket);
router.put('/:tournamentId/match/:matchId', auth, updateMatch);
router.delete('/:tournamentId', auth, deleteTournament);

module.exports = router;