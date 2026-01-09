const express = require('express');
const router = express.Router();
const { 
  createTeam, 
  getTeams, 
  getTeam, 
  joinTeam, 
  leaveTeam,
  deleteTeam,
  getMyTeams
} = require('../controllers/teamController');
const auth = require('../middleware/auth');
const { createTeamValidator, teamIdValidator } = require('../middleware/validators');

// ✅ Get all teams - JAVNA ruta (svi mogu vidjeti)
router.get('/', getTeams);

// ✅ Get MY teams - PRIVATNA ruta (mora biti prije /:id!)
router.get('/my-teams', auth, getMyTeams);

// ✅ Get single team - JAVNA ruta
router.get('/:id', teamIdValidator, getTeam);

// ✅ Create team - PRIVATNA ruta
router.post('/', auth, createTeamValidator, createTeam);

// ✅ Join team - PRIVATNA ruta
router.post('/:teamId/join', auth, teamIdValidator, joinTeam);

// ✅ Leave team - PRIVATNA ruta
router.post('/:teamId/leave', auth, teamIdValidator, leaveTeam);

// ✅ Delete team - PRIVATNA ruta
router.delete('/:teamId', auth, teamIdValidator, deleteTeam);

module.exports = router;