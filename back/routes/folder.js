const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');

// 새 폴더 생성
router.post('/studies/:studyId/folders', folderController.createFolder);

// 모든 폴더 목록 조회
router.get('/studies/:studyId/folders', folderController.getAllFolders);

// 폴더 이름 변경
router.patch('/studies/:studyId/folders/:id', folderController.renameFolder);

// 폴더 삭제
router.delete('/studies/:studyId/folders/:id', folderController.deleteFolder);

module.exports = router;