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
const StudyApplication = require('./models/StudyApplication');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Review = require('./models/Review');

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
      Material.deleteMany({}),
      StudyApplication.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Review.deleteMany({})
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
      },
      {
        study: studies[2]._id,
        title: '알고리즘 첫 모임',
        description: '문제 풀이 계획',
        dayOfWeek: tomorrow.getDay(),
        startDate: tomorrow,
        startTime: '16:00',
        endTime: '18:00',
        repeatWeekly: true,
        location: '공학관 202호',
        createdBy: user3._id,
        capacity: 10,
        participants: [user3._id, user4._id],
      },
      {
        study: studies[3]._id,
        title: 'JLPT 모의시험',
        description: 'N2 대비',
        dayOfWeek: tomorrow.getDay(),
        startDate: tomorrow,
        startTime: '09:00',
        endTime: '11:00',
        repeatWeekly: false,
        location: '어학원 305호',
        createdBy: user4._id,
        capacity: 4,
        participants: [user1._id, user4._id],
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

    // 🟢 루틴 생성
    await Routine.insertMany([
      {
        user: user1._id,
        title: '헬스',
        dayOfWeek: 1,
        startDate: now,
        startTime: '18:00',
        endTime: '19:00',
        repeatWeekly: true,
        color: 'green',
      },
      {
        user: user2._id,
        title: '영어회화 수업',
        dayOfWeek: 3,
        startDate: now,
        startTime: '10:00',
        endTime: '12:00',
        repeatWeekly: true,
        color: 'blue',
      }
    ]);
    console.log('✅ 루틴 생성 완료');

    // 🟢 출석 (각 스터디별)
    const attendances = [];
    for (let schedule of schedules) {
      const study = studies.find(s => s._id.equals(schedule.study));
      attendances.push(
        {
          schedule: schedule._id,
          study: study._id,
          user: study.members[0],
          status: '출석',
          scheduleTitle: schedule.title,
          scheduleDate: schedule.startDate,
        },
        {
          schedule: schedule._id,
          study: study._id,
          user: study.members[1],
          status: '지각',
          scheduleTitle: schedule.title,
          scheduleDate: schedule.startDate,
        }
      );
      if (study.members[2]) {
        attendances.push({
          schedule: schedule._id,
          study: study._id,
          user: study.members[2],
          status: '결석',
          scheduleTitle: schedule.title,
          scheduleDate: schedule.startDate,
        });
      }
    }
    await Attendance.insertMany(attendances);
    console.log('✅ 각 스터디별 출석 생성 완료');

    // 🟢 채팅방 & 메시지 (각 스터디별)
    for (const study of studies) {
      const chatRoom = await ChatRoom.create({
        studyId: study._id,
        members: study.members,
      });

      await Message.insertMany([
        {
          chatRoomId: chatRoom._id,
          sender: study.host,
          type: 'notice',
          content: `[${study.title}] 첫 공지사항입니다.`,
        },
        {
          chatRoomId: chatRoom._id,
          sender: study.members[0],
          type: 'text',
          content: '안녕하세요! 반갑습니다.',
        }
      ]);
    }
    console.log('✅ 각 스터디별 채팅방 & 메시지 생성 완료');

    // 🟢 스터디 신청
    await StudyApplication.insertMany([
      { study: studies[0]._id, applicant: user4._id, message: '참여하고 싶습니다.', status: 'pending' },
      { study: studies[1]._id, applicant: user3._id, message: '열심히 하겠습니다.', status: 'approved' }
    ]);
    console.log('✅ 스터디 신청 생성 완료');

    // 🟢 게시글 & 댓글
    const posts = await Post.insertMany([
      { study: studies[0]._id, author: user1._id, category: 'NOTICE', title: '첫 모임 공지', content: '내일 첫 모임 있습니다.' },
      { study: studies[1]._id, author: user2._id, category: 'FREE', title: '자유글', content: '스터디 끝나고 같이 밥먹을 사람?' }
    ]);

    await Comment.insertMany([
      { study: studies[0]._id, user: user2._id, content: '네 알겠습니다!', isSecret: false },
      { study: studies[1]._id, user: user4._id, content: '좋아요!', isSecret: false }
    ]);
    console.log('✅ 게시글 & 댓글 생성 완료');

    // 🟢 리뷰
    await Review.insertMany([
      { study: studies[0]._id, user: user2._id, rating: 5, comment: '좋은 스터디였습니다.' },
      { study: studies[1]._id, user: user4._id, rating: 4, comment: '도움이 많이 되었어요.' }
    ]);
    console.log('✅ 리뷰 생성 완료');

    process.exit();
  } catch (err) {
    console.error('❌ Seed 실패:', err.message);
    process.exit(1);
  }
}

seedDatabase();
