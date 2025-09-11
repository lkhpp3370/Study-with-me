// ✅ routes/routine.js
const express = require('express');
const router = express.Router();
const Routine = require('../models/Routine');
const mongoose = require('mongoose');

// 루틴 등록
router.post('/', async (req, res) => {
    try {
        const newRoutine = await Routine.create(req.body);
        res.status(201).json(newRoutine);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// 사용자 루틴 조회
router.get('/:userId', async (req, res) => {
  try {
    console.log('userId param:', req.params.userId);

    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: '유효하지 않은 userId입니다.' });
    }

    const routines = await Routine.find({
      user: new mongoose.Types.ObjectId(req.params.userId)
    });

    res.status(200).json(routines);
  } catch (err) {
    console.error('❌ 루틴 불러오기 실패:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 루틴 삭제
router.delete('/:id', async (req, res) => {
    try {
        await Routine.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: '삭제 완료' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;