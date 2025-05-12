// routes/main.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Study = require('../models/Study');

// ✅ GET /main/:userId → 해당 유저의 가입 스터디 조회
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // ✅ 해당 userId로 가입한 study 목록 찾기
    const studies = await Study.find({ members: userId }).populate('host', 'username');

    res.json({ studies });
  } catch (error) {
    console.error('❌ 스터디 조회 실패:', error.message);
    res.status(500).json({ message: '스터디 조회 실패' });
  }
});

module.exports = router;
