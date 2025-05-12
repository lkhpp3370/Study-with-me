// seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Study = require('./models/Study');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 MongoDB 연결 성공');

    await User.deleteMany({});
    await Study.deleteMany({});

    const user = new User({
      username: '이창현',
      email: 'changhyun@school.ac.kr', // ✅ 로그인용 이메일
      password: 'test1234',            // ✅ 로그인용 비밀번호 (현재 평문)
      grade: 3,
      major: '컴퓨터공학과',
      gender: '남',
      profile_image: '',
      bio: '안녕하세요, 백엔드 개발자입니다.',
      isLeave: false
    });

    await user.save();
    console.log(`✅ User 생성 완료: ${user._id}`);

    const study1 = new Study({
      title: '정보처리기사 스터디',
      description: '시험 대비 스터디',
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

    user.joinedStudies.push(study1._id);
    await user.save();

    console.log('✅ 스터디 + 사용자 연결 완료');
    process.exit();
  } catch (err) {
    console.error('❌ Seed 실패:', err.message);
    process.exit(1);
  }
}

seedDatabase();
