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

module.exports = router;