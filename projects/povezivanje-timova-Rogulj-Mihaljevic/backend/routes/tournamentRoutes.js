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
const { createTournamentValidator, tournamentIdValidator } = require('../middleware/validators'); // NOVO

router.post('/', auth, createTournamentValidator, createTournament); // DODAJ validator
router.get('/:id', tournamentIdValidator, getTournament); // DODAJ validator
router.post('/:tournamentId/register', auth, tournamentIdValidator, registerTeam); // DODAJ validator
module.exports = router;