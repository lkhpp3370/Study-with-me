// routes/postcomment.js
const express = require('express');
const router = express.Router();
const postcommentController = require('../controllers/postcommentController');

// 댓글 목록 조회
router.get('/post/:postId', postcommentController.getCommentsByPost);

// 댓글 작성
router.post('/post/:postId', postcommentController.createComment);

// 댓글 삭제
router.delete('/:commentId', postcommentController.deleteComment);

module.exports = router;