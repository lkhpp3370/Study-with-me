// seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Study = require('./models/Study');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 MongoDB 연결됨');

    // 기존 데이터 삭제
    await User.deleteMany({});
    await Study.deleteMany({});

    // 1. 사용자 생성
    const user = new User({
      username: '이창현',
      email: 'changhyun@school.ac.kr',
      password: 'test1234', // 실제 서비스에서는 암호화 필수!
      joinedStudies: [] // 나중에 넣음
    });
    await user.save();

    // 2. 스터디 생성
    const study = new Study({
      title: '정보처리기사 스터디',
      description: '6월 시험 대비 주 2회 오프라인 스터디',
      category: '자격증',
      gender_rule: '성별무관',
      join_type: '자유가입',
      duration: '정규스터디',
      capacity: 5,
      isRecruiting: true,
      host: user._id,
      members: [user._id]
    });
    await study.save();

    // 3. 사용자 → 스터디 관계 맺기
    user.joinedStudies.push(study._id);
    await user.save();

    console.log('✅ Seed 데이터 생성 완료');
    console.log(`👉 사용자 ID: ${user._id}`);
    console.log(`👉 스터디 ID: ${study._id}`);
    process.exit();
  } catch (err) {
    console.error('❌ 시드 데이터 생성 오류:', err);
    process.exit(1);
  }
}

seedDatabase();
