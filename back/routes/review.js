const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// ✅ 리뷰 목록 + 평균
router.get('/:studyId', reviewController.getStudyReviews);

// ✅ 리뷰 작성/수정
router.post('/:studyId', reviewController.upsertReview);

// ✅ 리뷰 삭제
router.delete('/:reviewId', reviewController.deleteReview);

// ✅ 리뷰 추천 토글
router.post('/:reviewId/recommend', reviewController.toggleRecommend);

module.exports = router;
