// routes/study.js
const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');

// ✅ 스터디 ID로 상세 조회
router.get('/:studyId', studyController.getStudyById);

// ✅ 스터디 목록 테스트용 API (임시용)
router.get('/', (req, res) => {
  res.json([
    { title: '정보처리기사 스터디', category: '자격증' },
    { title: '토익 스터디', category: '어학' },
    { title: '프로그래밍 스터디', category: '개발' }
  ]);
});

module.exports = router;
