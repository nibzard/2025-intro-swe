const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

// Sve rute zahtijevaju autentifikaciju (auth middleware)

// POST /api/teams - kreiraj tim
router.post('/', auth, teamController.createTeam);

// GET /api/teams - dohvati sve timove (s filterima)
router.get('/', auth, teamController.getTeams);

// GET /api/teams/my - dohvati moje timove
router.get('/my', auth, teamController.getMyTeams);

// GET /api/teams/:id - dohvati jedan tim
router.get('/:id', auth, teamController.getTeam);

// POST /api/teams/:id/join - pridruži se timu
router.post('/:id/join', auth, teamController.joinTeam);

// POST /api/teams/:id/leave - napusti tim
router.post('/:id/leave', auth, teamController.leaveTeam);

// DELETE /api/teams/:id - obriši tim
router.delete('/:id', auth, teamController.deleteTeam);

module.exports = router;