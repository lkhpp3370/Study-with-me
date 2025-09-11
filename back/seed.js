const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.set('strictQuery', true);

const User = require('./models/User');
const Study = require('./models/Study');
const Schedule = require('./models/Schedule');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const Routine = require('./models/Routine');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');
const Folder = require('./models/Folder');
const Material = require('./models/Material');

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/studywithme';
    await mongoose.connect(mongoUri);
    console.log('📡 MongoDB 연결 성공');

    // ✅ 기존 데이터 초기화
    await Promise.all([
      User.deleteMany({}),
      Study.deleteMany({}),
      Schedule.deleteMany({}),
      ChatRoom.deleteMany({}),
      Message.deleteMany({}),
      Routine.deleteMany({}),
      Attendance.deleteMany({}),
      Notification.deleteMany({}),
      Folder.deleteMany({}),
      Material.deleteMany({})
    ]);
    console.log('✅ 기존 데이터 삭제 완료');

    const notiSettings = {
      push: true, chat: true, apply: true, approve: true,
      schedule: true, reminder: true, notice: true,
      commentApply: true, commentPost: true,
    };

    // 👥 사용자 생성
    const users = await User.insertMany([
      {
        username: 'Tester',
        email: 'tester@pukyong.ac.kr',
        password: 'test1234',
        grade: 3,
        major: '정보융합대학',
        gender: '남',
        bio: '안녕하세요, 백엔드 개발자입니다.',
        isLeave: false,
        privacy: { gender: true, major: true, grade: true },
        notifications: notiSettings,
      },
      {
        username: 'SubUser',
        email: 'subuser@pukyong.ac.kr',
        password: 'sub1234',
        grade: 2,
        major: '공과대학',
        gender: '여',
        bio: '서브 유저입니다.',
        isLeave: false,
        privacy: { gender: true, major: true, grade: true },
        notifications: notiSettings,
      },
      {
        username: 'Alice',
        email: 'alice@pukyong.ac.kr',
        password: 'alice123',
        grade: 1,
        major: '경영대학',
        gender: '여',
        bio: '열정적인 대학생',
        isLeave: false,
        privacy: { gender: true, major: true, grade: true },
        notifications: notiSettings,
      },
      {
        username: 'Bob',
        email: 'bob@pukyong.ac.kr',
        password: 'bob123',
        grade: 4,
        major: '공과대학',
        gender: '남',
        bio: '취업 준비 중',
        isLeave: false,
        privacy: { gender: true, major: true, grade: true },
        notifications: notiSettings,
      }
    ]);
    console.log('✅ 유저 생성 완료');
    const [user1, user2, user3, user4] = users;

    // 📚 스터디 생성
    const studies = await Study.insertMany([
      {
        title: '정보처리기사 스터디',
        description: '시험 대비 스터디입니다.',
        category: '자격증',
        subCategory: '정보처리기사',
        gender_rule: '무관',
        duration: '정규',
        days: ['월', '수'],
        capacity: 5,
        host: user1._id,
        members: [user1._id, user2._id, user3._id],
      },
      {
        title: '토익 스터디',
        description: '토익 목표 900점!',
        category: '영어',
        subCategory: '토익',
        gender_rule: '무관',
        duration: '자유',
        capacity: 6,
        host: user2._id,
        members: [user1._id, user2._id, user4._id],
      },
      {
        title: '알고리즘 스터디',
        description: '매주 문제 풀이',
        category: '취업',
        subCategory: 'IT',
        gender_rule: '무관',
        duration: '정규',
        days: ['화', '목'],
        capacity: 10,
        host: user3._id,
        members: [user3._id, user4._id],
      },
      {
        title: 'JLPT 스터디',
        description: '일본어 능력시험 대비',
        category: '영어',
        subCategory: 'JLPT',
        gender_rule: '무관',
        duration: '정규',
        days: ['토'],
        capacity: 4,
        host: user4._id,
        members: [user1._id, user4._id],
      }
    ]);
    console.log('✅ 스터디 생성 완료');

    // 📅 일정 생성
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const pastDate = new Date(now); pastDate.setDate(now.getDate() - 7);

    const schedules = await Schedule.insertMany([
      {
        study: studies[0]._id,
        title: '정보처리 스터디 첫 모임',
        description: '오리엔테이션',
        dayOfWeek: tomorrow.getDay(),
        startDate: tomorrow,
        startTime: '10:00',
        endTime: '11:00',
        repeatWeekly: false,
        location: '도서관 3층',
        createdBy: user1._id,
        capacity: 5,
        participants: [user1._id, user2._id],
      },
      {
        study: studies[1]._id,
        title: '토익 모의시험',
        description: 'LC/RC',
        dayOfWeek: tomorrow.getDay(),
        startDate: tomorrow,
        startTime: '14:00',
        endTime: '15:00',
        repeatWeekly: false,
        location: '어학관 101호',
        createdBy: user2._id,
        capacity: 6,
        participants: [user1._id, user2._id, user4._id],
      }
    ]);
    console.log('✅ 일정 생성 완료');

    // 📂 폴더 & 자료 생성
    const folders = await Folder.insertMany([
      { name: '스터디 자료', study: studies[0]._id, owner: user1._id },
      { name: '개인 자료', owner: user2._id }
    ]);
    await Material.insertMany([
      { title: '스터디 교안', filename: 'doc1.pdf', filepath: '/uploads/doc1.pdf', uploader: user1._id, folder: folders[0]._id },
      { title: '토익 단어장', filename: 'doc2.pdf', filepath: '/uploads/doc2.pdf', uploader: user2._id, folder: folders[0]._id },
    ]);
    console.log('✅ 폴더 & 자료 생성 완료');

    // 🔔 알림 테스트
    await Notification.create({
      user: user2._id,
      type: 'schedule',
      content: `[${studies[0].title}]에 새 일정이 등록되었습니다.`,
      targetId: schedules[0]._id,
      targetType: 'Schedule',
    });
    console.log('✅ 알림 생성 완료');

    process.exit();
  } catch (err) {
    console.error('❌ Seed 실패:', err.message);
    process.exit(1);
  }
}

seedDatabase();
