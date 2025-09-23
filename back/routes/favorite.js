const express = require('express');
const router = express.Router();
const favController = require('../controllers/favoriteController');

router.post('/:placeId/favorite', favController.toggleFavorite);

module.exports = router;
