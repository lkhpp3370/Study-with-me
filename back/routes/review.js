const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/:studyId', reviewController.getStudyReviews);
router.post('/:studyId', reviewController.upsertReview);
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
