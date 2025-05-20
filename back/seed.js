const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.set('strictQuery', true);

const User = require('./models/User');
const Study = require('./models/Study');
const Schedule = require('./models/Schedule');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/studywithme';
    await mongoose.connect(mongoUri);
    console.log('📡 MongoDB 연결 성공');

    await User.deleteMany({});
    await Study.deleteMany({});
    await Schedule.deleteMany({});
    await ChatRoom.deleteMany({});
    await Message.deleteMany({});
    console.log('✅ 기존 데이터 삭제 완료');

    const notiSettings = {
      push: true,
      chat: true,
      apply: true,
      approve: true,
      schedule: true,
      reminder: true,
      notice: true,
      commentApply: true,
      commentPost: true
    };

    const user1 = new User({
      username: 'Tester',
      email: 'tester@pukyong.ac.kr',
      password: 'test1234',
      grade: 3,
      major: '정보융합대학',
      gender: '남',
      bio: '안녕하세요, 백엔드 개발자입니다.',
      isLeave: false,
      profile_image: '',
      privacy: { gender: true, major: true, grade: true },
      notifications: notiSettings
    });
    await user1.save();

    const user2 = new User({
      username: 'SubUser',
      email: 'subuser@pukyong.ac.kr',
      password: 'sub1234',
      grade: 2,
      major: '공과대학',
      gender: '여',
      bio: '서브 유저입니다.',
      isLeave: false,
      profile_image: '',
      privacy: { gender: true, major: true, grade: true },
      notifications: notiSettings
    });
    await user2.save();

    console.log('✅ 유저 생성 완료');

    const study1 = new Study({
      title: '정보처리기사 스터디',
      description: '시험 대비 스터디입니다.',
      category: '자격증',
      gender_rule: '성별무관',
      join_type: '자유가입',
      duration: '정규스터디',
      capacity: 5,
      isRecruiting: true,
      host: user1._id,
      members: [user1._id, user2._id]
    });

    const study2 = new Study({
      title: '토익 스터디',
      description: '토익 목표 900점!',
      category: '어학',
      gender_rule: '성별무관',
      join_type: '자유가입',
      duration: '단기스터디',
      capacity: 6,
      isRecruiting: true,
      host: user1._id,
      members: [user1._id, user2._id]
    });

    await study1.save();
    await study2.save();

    user1.joinedStudies.push(study1._id, study2._id);
    user2.joinedStudies.push(study1._id, study2._id);
    await user1.save();
    await user2.save();

    console.log('✅ 스터디 및 가입 완료');

    const today = new Date();
    const schedules = [
      {
        study: study1._id,
        title: '정보처리 스터디 첫 모임',
        description: '오리엔테이션 진행',
        start: new Date(today.setHours(10, 0, 0)),
        end: new Date(today.setHours(11, 0, 0)),
        location: '도서관 3층'
      },
      {
        study: study2._id,
        title: '토익 모의시험',
        description: 'LC/RC 모의 평가',
        start: new Date(today.setHours(14, 0, 0)),
        end: new Date(today.setHours(15, 0, 0)),
        location: '어학관 101호'
      }
    ];

    for (const sch of schedules) {
      const schedule = new Schedule({
        study: sch.study,
        title: sch.title,
        description: sch.description,
        start: sch.start,
        end: sch.end,
        createdBy: user1._id,
        location: sch.location
      });
      await schedule.save();
      console.log(`✅ 일정 생성 완료: ${sch.title}`);
    }

    // ✅ 채팅방 및 공지 생성
    const chatRoom1 = new ChatRoom({
      studyId: study1._id,
      members: [user1._id, user2._id]
    });
    const chatRoom2 = new ChatRoom({
      studyId: study2._id,
      members: [user1._id, user2._id]
    });
    await chatRoom1.save();
    await chatRoom2.save();

    const notice1 = new Message({
      chatRoomId: chatRoom1._id,
      sender: user1._id,
      type: 'notice',
      content: '📌 매주 화요일 10시에 정기 모임입니다.'
    });
    const notice2 = new Message({
      chatRoomId: chatRoom2._id,
      sender: user1._id,
      type: 'notice',
      content: '📌 토익 스터디는 금요일 오후 2시에 시작합니다.'
    });
    await notice1.save();
    await notice2.save();

    chatRoom1.noticeMessageId = notice1._id;
    chatRoom2.noticeMessageId = notice2._id;
    await chatRoom1.save();
    await chatRoom2.save();

    console.log('✅ 채팅방 및 공지 메시지 생성 완료');

    process.exit();
  } catch (err) {
    console.error('❌ Seed 실패:', err.message);
    process.exit(1);
  }
}

seedDatabase();
