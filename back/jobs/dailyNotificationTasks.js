// jobs/dailyNotificationTasks.js

const Schedule = require('../models/Schedule');
const Study = require('../models/Study');
const Notification = require('../models/Notification');
const { sendNotification } = require('../utils/notify');

/** D-1 일정 알림 전송 */
async function sendD1Reminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59`);

  const schedules = await Schedule.find({ start: { $gte: start, $lte: end } }).populate('study');

  for (const schedule of schedules) {
    const study = await Study.findById(schedule.study._id).populate('members');

    for (const member of study.members) {
      await sendNotification(
        member._id,
        'reminder',
        `[${study.title}] 일정이 내일 예정되어 있습니다: ${schedule.title}`,
        schedule._id,
        'Schedule'
      );
    }
  }

  console.log(`✅ D-1 일정 알림 전송 완료 (${schedules.length}건)`);
}

/** 당일 일정 알림 전송 */
async function sendTodayReminders() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59`);

  const schedules = await Schedule.find({ start: { $gte: start, $lte: end } }).populate('study');

  for (const schedule of schedules) {
    const study = await Study.findById(schedule.study._id).populate('members');

    for (const member of study.members) {
      await sendNotification(
        member._id,
        'reminder',
        `[${study.title}] 오늘 예정된 일정이 있습니다: ${schedule.title}`,
        schedule._id,
        'Schedule'
      );
    }
  }

  console.log(`✅ 오늘 일정 알림 전송 완료 (${schedules.length}건)`);
}

/** 읽은 알림 15일 후 자동 삭제 */
async function deleteOldNotifications() {
  const now = new Date();
  const threshold = new Date(now.setDate(now.getDate() - 15));

  const result = await Notification.deleteMany({
    isRead: true,
    readAt: { $lte: threshold }
  });

  console.log(`🧹 ${result.deletedCount || 0}건의 오래된 알림 삭제 완료`);
}

/** 메인 실행 함수 */
async function runDailyTasks() {
  try {
    await sendD1Reminders();
    await sendTodayReminders();
    await deleteOldNotifications();
    console.log('✅ 모든 알림 관련 일일 작업 완료');
  } catch (err) {
    console.error('❌ 일일 알림 작업 실패:', err.message);
  }
}

module.exports = { runDailyTasks };
