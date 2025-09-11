const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');

// ✅ 스터디 생성
router.post('/create', studyController.createStudy);

// ✅ 스터디 검색
router.get('/search', studyController.searchStudies);

// ✅ 스터디 단건 조회
router.get('/:studyId', studyController.getStudyById);

// ✅ 모집 중단
router.patch('/:studyId/stop', studyController.stopRecruiting);

module.exports = router;
