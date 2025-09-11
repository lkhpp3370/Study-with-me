const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// 특정 스터디의 게시글 목록 조회 (카테고리별 필터링 포함)
router.get('/study/:studyId', postController.getPostsByStudy);

// 특정 스터디 내에서 게시글 검색
router.get('/study/:studyId/search', postController.searchPosts);

// 특정 게시글 조회
router.get('/:id', postController.getPostById);

// 특정 스터디에 게시글 작성
router.post('/study/:studyId', postController.createPost);

// 게시글 수정
router.put('/:id', postController.updatePost);

// 게시글 삭제
router.delete('/:id', postController.deletePost);

module.exports = router;