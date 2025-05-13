// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.set('strictQuery', true); // ✅ Mongoose 7 이상 권장 옵션

const User = require('./models/User');
const Study = require('./models/Study');

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/studywithme';
    await mongoose.connect(mongoUri);
    console.log('📡 MongoDB 연결 성공');

    // ✅ 기존 데이터 초기화
    await User.deleteMany({});
    await Study.deleteMany({});
    console.log('✅ 기존 User, Study 데이터 삭제 완료');

    // ✅ 샘플 User 생성
    const user = new User({
      username: 'Tester',
      email: 'tester@pukyong.ac.kr',
      password: 'test1234',
      grade: 3,
      major: '정보융합대학',
      gender: '남',
      profile_image: '',
      bio: '안녕하세요, 백엔드 개발자입니다.',
      isLeave: false,
      privacy: { gender: true, major: true, grade: true },
      joinedStudies: [],
      notifications: {
        push: true,
        comment: true,
        apply: true,
        schedule: true,
        notice: true
      },
      resetCode: null
    });

    await user.save();
    console.log(`✅ User 생성 완료: ${user._id}`);

    // ✅ 샘플 Study 생성
    const study1 = new Study({
      title: '정보처리기사 스터디',
      description: '시험 대비 스터디입니다.',
      category: '자격증',
      gender_rule: '성별무관',
      join_type: '자유가입',
      duration: '정규스터디',
      capacity: 5,
      isRecruiting: true,
      host: user._id,
      members: [user._id]
    });

    await study1.save();
    console.log(`✅ Study 생성 완료: ${study1._id}`);

    // ✅ User와 Study 연결
    user.joinedStudies.push(study1._id);
    await user.save();
    console.log('✅ User와 Study 연결 완료');

    process.exit();
  } catch (err) {
    console.error('❌ Seed 실패:', err.message);
    process.exit(1);
  }
}

seedDatabase();
