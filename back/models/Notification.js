const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'apply', 'approve', 'schedule', 'reminder', 'notice', 'commentApply', 'commentPost'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
  type: Date
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },     // 👈 어떤 리소스와 연결됐는지
  targetType: { 
    type: String 
  }                            // 👈 Schedule, Study, Post 등 구분
});

module.exports = mongoose.model('Notification', NotificationSchema);
