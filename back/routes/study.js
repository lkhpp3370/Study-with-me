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

// ✅ 스터디에서 멤버 제거
router.delete('/:studyId/members/:memberId', studyController.removeMember);

// ✅ 스터디장 위임
router.patch('/:studyId/delegate-host', studyController.delegateHost);
module.exports = router;