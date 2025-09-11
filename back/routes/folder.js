const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');

// 새 폴더 생성
router.post('/', folderController.createFolder);
// 모든 폴더 목록 조회 (쿼리 파라미터로 필터링 가능)
router.get('/', folderController.getAllFolders);
// 폴더 이름 변경
router.patch('/:id', folderController.renameFolder);
// 폴더 삭제
router.delete('/:id', folderController.deleteFolder);

module.exports = router;