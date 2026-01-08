const express = require('express');
const router = express.Router();
const {
  getStats,
  upsertStats,
  addMatch,
  deleteMatch
} = require('../controllers/statsController');
const auth = require('../middleware/auth');

router.get('/', auth, getStats);
router.post('/', auth, upsertStats);
router.post('/match', auth, addMatch);
router.delete('/match/:matchId', auth, deleteMatch);
const { addMatchValidator } = require('../middleware/validators'); // NOVO

router.post('/match', auth, addMatchValidator, addMatch); // DODAJ validator
module.exports = router;