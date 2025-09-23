// routes/favorite.js
const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// 즐겨찾기 목록 조회
router.get('/', favoriteController.getFavorites);

// 즐겨찾기 토글
router.post('/toggle', favoriteController.toggleFavorite);

module.exports = router;
