const mongoose = require('mongoose'); // mongoose 라이브러리를 불러옵니다.

// 사용자(User) 스키마 정의
const UserSchema = new mongoose.Schema({
  username: String,  // 닉네임
  email: String,     // 로그인용 이메일 주소
  password: String,  // 비밀번호 (해싱 필요)
  grade: Number,     // 학년 (1~4)
  major: String,     // 전공 학과
  gender: String,    // 성별 (남, 여, 선택안함 등)
  profile_image: String, // 프로필 사진 URL (S3 또는 서버 저장용)
  bio: String,       // 자기소개
  isLeave: Boolean,  // 휴학 여부 (true: 휴학 중, false: 재학)
  privacy: {
    type: Boolean,
    default: true     // true일 경우 프로필 공개
  },
  joinedStudies: [{
    type: mongoose.Schema.Types.ObjectId, // 사용자 참여 스터디 ID
    ref: 'Study'                          // 참조할 모델 이름
  }],
  notifications: { // 알림 설정 항목 (설정 페이지에서 수정 가능)
    push: { type: Boolean, default: true },      // 푸시 알림 전체 여부
    comment: { type: Boolean, default: true },   // 댓글 알림
    apply: { type: Boolean, default: true },     // 스터디 신청/승인 알림
    schedule: { type: Boolean, default: true },  // 스터디 일정 알림
    notice: { type: Boolean, default: true }     // 공지사항 알림
  }
});

// 위에서 정의한 스키마로 모델을 생성하여 외부에서 사용할 수 있도록 export 합니다.
module.exports = mongoose.model('User', UserSchema);
