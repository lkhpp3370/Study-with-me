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
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  location: {                  // ✅ 추가된 모임 장소 필드
    type: String,
    default: '장소 미정'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
