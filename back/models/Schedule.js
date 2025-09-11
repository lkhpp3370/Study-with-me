const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  study: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,

  // ✅ Routine과 동일한 구조
  dayOfWeek: { type: Number, required: true },   // 0=일 ~ 6=토
  startDate: { type: Date, required: true },     // 시작 기준일
  startTime: { type: String, required: true },   // "HH:mm"
  endTime:   { type: String, required: true },   // "HH:mm"
  repeatWeekly: { type: Boolean, default: false },

  location: {
    type: String,
    default: '장소 미정',
  },

  // 📌 일정 개최자 (스터디장/생성자)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // 📌 일정 참여자 목록
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],

  // 📌 참여 인원 제한 (0이면 무제한)
  capacity: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
