const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const materialController = require('../controllers/materialController');

// 새 자료(파일) 업로드 (multer 미들웨어 사용)
router.post('/studies/:studyId/files', upload.single('file'), materialController.uploadMaterial);

// 모든 자료(파일) 목록 조회 (folderId 쿼리 파라미터로 특정 폴더 내 파일만 조회 가능)
router.get('/studies/:studyId/files', materialController.getAllFiles);

// 자료(파일) 제목 검색 (keyword 및 folderId 쿼리 파라미터로 검색 가능)
router.get('/studies/:studyId/search', materialController.searchMaterials);

// 특정 자료(파일) 삭제
router.delete('/studies/:studyId/files/:id', materialController.deleteMaterial);

// 특정 자료(파일) 제목 변경
router.patch('/studies/:studyId/files/:id', materialController.renameMaterial);

module.exports = router;