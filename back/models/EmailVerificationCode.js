const mongoose = require('mongoose');

const EmailVerificationCodeSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5분 후 자동 삭제
});

module.exports = mongoose.model('EmailVerificationCode', EmailVerificationCodeSchema);
