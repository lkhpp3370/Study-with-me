const mongoose = require('mongoose');

const RoutineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },

  // 0=일 ~ 6=토
  dayOfWeek: { type: Number, required: true },

  // 표시 기준이 되는 날짜 (반복이든 비반복이든 최초 시작 주차를 명시)
  // - repeatWeekly=false: 이 날짜가 속한 주에만 표시
  // - repeatWeekly=true: 이 날짜가 속한 주부터 이후 주에 표시
  startDate: { type: Date, required: true },

  startTime: { type: String, required: true }, // "HH:mm"
  endTime:   { type: String, required: true },

  repeatWeekly: { type: Boolean, default: false },
  color: { type: String, required: true },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Routine', RoutineSchema);
