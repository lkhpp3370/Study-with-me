const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// 댓글 조회
router.get('/:studyId', commentController.getComments);

// 댓글 작성
router.post('/:studyId', commentController.createComment);

// 댓글 삭제
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
