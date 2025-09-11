const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  study: { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['출석', '지각', '결석'], required: true },

  // 최소 정보 백업 (원본 스케줄이 사라져도 유지되게)
  scheduleTitle: String,
  scheduleDate: Date,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
