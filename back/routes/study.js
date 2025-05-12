const express = require('express');
const router = express.Router();

// ✅ 스터디 목록 테스트용 API
router.get('/', (req, res) => {
  res.json([
    { title: '정보처리기사 스터디', category: '자격증' },
    { title: '토익 스터디', category: '어학' },
    { title: '프로그래밍 스터디', category: '개발' }
  ]);
});

module.exports = router;
