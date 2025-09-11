const mongoose = require('mongoose');

const StudySchema = new mongoose.Schema({
  title: { type: String, required: true },          // 스터디 이름
  description: { type: String, required: true },    // 소개글
  category: { type: String, required: true },       // 메인 카테고리 (취업, 자격증, 대회, 영어, 출석)
  subCategory: { type: String },                    // 서브 카테고리 (IT, 디자인, 한국사, 토익 등)
  gender_rule: { type: String, default: '무관' },   // 성별 제한
  duration: { type: String, default: '자유' },      // 자유 / 정규
  days: [String],                                   // 정규 스터디 요일 (자유면 빈 배열)
  capacity: { type: Number, default: 0 },           // 최대 인원 (0 = 무제한)
  isRecruiting: { type: Boolean, default: true },   // 모집 여부 (자동/수동)
  createdAt: { type: Date, default: Date.now },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// ✅ 모집 상태 자동 업데이트 훅
StudySchema.pre('save', function (next) {
  if (this.capacity > 0 && this.members.length >= this.capacity) {
    this.isRecruiting = false; // 정원 도달 → 모집 종료
  }
  next();
});

module.exports = mongoose.model('Study', StudySchema);
