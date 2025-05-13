// backend/models/EmailVerificationCode.js
const mongoose = require('mongoose');

const EmailVerificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300   // ✅ 생성 후 5분(300초) 뒤 자동 삭제
  }
});

module.exports = mongoose.model('EmailVerificationCode', EmailVerificationCodeSchema);
