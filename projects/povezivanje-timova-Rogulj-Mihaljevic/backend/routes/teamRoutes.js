const express = require('express');
const router = express.Router();
const { 
  createTeam, 
  getTeams, 
  getTeam, 
  joinTeam, 
  leaveTeam,
  deleteTeam,
  getMyTeams  // NOVO
} = require('../controllers/teamController');
const auth = require('../middleware/auth');

router.post('/', auth, createTeam);
router.get('/', getTeams);
router.get('/my-teams', auth, getMyTeams); // NOVO - mora biti prije /:id
router.get('/:id', getTeam);
router.post('/:teamId/join', auth, joinTeam);
router.post('/:teamId/leave', auth, leaveTeam);
router.delete('/:teamId', auth, deleteTeam);
const { createTeamValidator, teamIdValidator } = require('../middleware/validators'); // NOVO

router.post('/', auth, createTeamValidator, createTeam); // DODAJ validator
router.get('/:teamId', teamIdValidator, getTeam); // DODAJ validator
router.post('/:teamId/join', auth, teamIdValidator, joinTeam); // DODAJ validator
router.post('/:teamId/leave', auth, teamIdValidator, leaveTeam); // DODAJ validator
router.delete('/:teamId', auth, teamIdValidator, deleteTeam); // DODAJ validator

module.exports = router;