// routes/placeReview.js
const express = require('express');
const router = express.Router();
const placeReviewController = require('../controllers/placeReviewController');

// 특정 장소 리뷰 조회
router.get('/:placeId', placeReviewController.getReviewsByPlace);

// 리뷰 작성
router.post('/:placeId', placeReviewController.addReview);

// 리뷰 수정
router.patch('/:reviewId', placeReviewController.updateReview);

// 리뷰 삭제
router.delete('/:reviewId', placeReviewController.deleteReview);

module.exports = router;
