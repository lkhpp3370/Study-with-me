const mongoose = require('mongoose'); // mongoose 불러오기

// Study 스키마 정의
const StudySchema = new mongoose.Schema({
  title: String,                       // 스터디 이름
  description: String,                 // 스터디 소개글
  category: String,                    // 스터디 분야 (예: 자격증, 취업 등)
  gender_rule: String,                 // 성별 제한 (예: 남, 여, 성별무관)
  join_type: String,                   // 가입 방법 (자유가입, 승인가입)
  duration: String,                    // 스터디 기간 (자유, 정규)
  capacity: Number,                    // 최대 인원수
  isRecruiting: Boolean,               // 모집 여부
  createdAt: { type: Date, default: Date.now }, // 생성일
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 방장
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // 참여 멤버
});

// 모델 생성 및 export
module.exports = mongoose.model('Study', StudySchema);
