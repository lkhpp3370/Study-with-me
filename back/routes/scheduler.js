// routes/scheduler.js
const express = require('express');
const router = express.Router();
const { runDailyTasks } = require('../jobs/dailyNotificationTasks');

router.post('/daily', async (req, res) => {
  try {
    await runDailyTasks();
    res.json({ message: '일일 알림 작업 실행 완료' });
  } catch (err) {
    res.status(500).json({ error: '일일 알림 작업 실패', detail: err.message });
  }
});

module.exports = router;
