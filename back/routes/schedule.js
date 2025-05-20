const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const scheduleController = require('../controllers/scheduleController');
const Schedule = require('../models/Schedule');


// ✅ 일정 등록
router.post('/', scheduleController.createSchedule);

// ✅ 특정 스터디 일정 조회
router.get('/study/:studyId', scheduleController.getStudySchedules);

// ✅ 메인페이지 전체 일정 조회
router.get('/user/:userId', scheduleController.getUserSchedules);

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: '유효하지 않은 일정 ID입니다.' });
  }

  try {
    const schedule = await Schedule.findById(id).populate('study', '_id title');

    // ✅ 일정 자체가 없거나 스터디가 삭제되어 존재하지 않음
    if (!schedule || !schedule.study) {
      return res.status(404).json({ message: '일정 또는 스터디를 찾을 수 없습니다.' });
    }

    res.json(schedule);
  } catch (err) {
    console.error('❌ 일정 조회 실패:', err.message);
    res.status(500).json({ message: '일정 조회 실패', error: err.message });
  }
});

module.exports = router;