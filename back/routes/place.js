const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');

router.get('/', placeController.getPlaces);
router.post('/', placeController.addPlace);
router.patch('/:id', placeController.updatePlace);

module.exports = router;
