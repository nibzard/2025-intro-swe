const express = require('express');
const router = express.Router();
const {
  getTournaments,
  getTournament,
  createTournament,
  registerTeam,
  generateBracket,
  updateMatch,
  deleteTournament
} = require('../controllers/tournamentController');
const auth = require('../middleware/auth');

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.post('/', auth, createTournament);
router.post('/:tournamentId/register', auth, registerTeam);
router.post('/:tournamentId/generate-bracket', auth, generateBracket);
router.put('/:tournamentId/match/:matchId', auth, updateMatch);
router.delete('/:tournamentId', auth, deleteTournament);

module.exports = router;