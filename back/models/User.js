// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true }, // 추가: 필수로 입력받기
  email: { 
    type: String, 
    required: true, 
    unique: true,  // ✅ 고유 제약 조건 추가
    lowercase: true, // 이메일을 소문자로 자동 변환
    trim: true // 공백 제거
  },
  password: { type: String, required: true }, // 추가: 필수로 입력받기
  grade: { type: Number, required: true }, // 추가: 필수로 입력받기
  major: { type: String, required: true }, // 추가: 필수로 입력받기
  gender: { type: String, required: true }, // 추가: 필수로 입력받기
  profile_image: String,
  bio: String,
  isLeave: Boolean,
  privacy: {
    gender: { type: Boolean, default: true },
    major: { type: Boolean, default: true },
    grade: { type: Boolean, default: true }
  },
  joinedStudies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study'
  }],
  notifications: {
    push: { type: Boolean, default: true },
    comment: { type: Boolean, default: true },
    apply: { type: Boolean, default: true },
    schedule: { type: Boolean, default: true },
    notice: { type: Boolean, default: true }
  },
  resetCode: String
});

// 모델을 exports로 내보냄
module.exports = mongoose.model('User', UserSchema);
