const express = require('express');
const router = express.Router();
const {
  getFields,
  getField,
  createField,
  addReview,
  deleteField
} = require('../controllers/fieldController');
const auth = require('../middleware/auth');
const { uploadFieldImages } = require('../middleware/upload');

router.get('/', getFields);
router.get('/:fieldId', getField);
router.post('/', auth, uploadFieldImages.array('images', 5), createField); // Max 5 slika
router.post('/:fieldId/review', auth, addReview);
router.delete('/:fieldId', auth, deleteField);

module.exports = router;