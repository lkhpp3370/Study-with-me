const Study = require('../models/Study');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const Post = require('../models/Post');
const PostComment = require('../models/PostComment');
const Comment = require('../models/Comment');
const Folder = require('../models/Folder');
const Material = require('../models/Material');
const Review = require('../models/Review');
const StudyApplication = require('../models/StudyApplication');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * ✅ 공통 헬퍼: 스터디와 모든 연관 데이터 삭제
 * - 일정(Schedule), 출석(Attendance)
 * - 채팅방(ChatRoom) + 메시지(Message)
 * - 게시글(Post) + 게시글 댓글(PostComment)
 * - 일반 댓글(Comment)
 * - 자료 폴더(Folder) + 자료(Material)
 * - 리뷰(Review), 가입 신청(StudyApplication)
 * - 알림(Notification: targetId가 study / schedule / post 인 것)
 * - User.joinedStudies 에서 해당 스터디 제거
 * - 마지막으로 Study 자체 삭제
 */
async function deleteStudyWithRelations(studyId) {
  // 1) 일정
  const schedules = await Schedule.find({ study: studyId });
  const scheduleIds = schedules.map((s) => s._id);

  await Schedule.deleteMany({ study: studyId });

  // 2) 출석
  await Attendance.deleteMany({ study: studyId });

  // 3) 채팅방 + 메시지
  const rooms = await ChatRoom.find({ studyId });
  const roomIds = rooms.map((r) => r._id);

  if (roomIds.length > 0) {
    await Message.deleteMany({ chatRoomId: { $in: roomIds } });
  }
  await ChatRoom.deleteMany({ studyId });

  // 4) 게시글 + 게시글 댓글
  const posts = await Post.find({ study: studyId });
  const postIds = posts.map((p) => p._id);

  if (postIds.length > 0) {
    await PostComment.deleteMany({ post: { $in: postIds } });
  }
  await Post.deleteMany({ study: studyId });

  // 5) 일반 댓글(Comment)
  await Comment.deleteMany({ study: studyId });

  // 6) 자료 폴더 + 자료
  const folders = await Folder.find({ study: studyId });
  const folderIds = folders.map((f) => f._id);

  if (folderIds.length > 0) {
    await Material.deleteMany({ folder: { $in: folderIds } });
  }
  await Folder.deleteMany({ study: studyId });

  // 7) 리뷰
  await Review.deleteMany({ study: studyId });

  // 8) 가입 신청
  await StudyApplication.deleteMany({ study: studyId });

  // 9) 알림 (study / schedule / post 를 가리키는 것들)
  const targetIds = [
    studyId,
    ...scheduleIds,
    ...postIds,
  ];
  if (targetIds.length > 0) {
    await Notification.deleteMany({ targetId: { $in: targetIds } });
  }

  // 10) 유저 joinedStudies 정리
  await User.updateMany(
    { joinedStudies: studyId },
    { $pull: { joinedStudies: studyId } }
  );

  // 11) Study 자체 삭제
  await Study.findByIdAndDelete(studyId);
}

// ✅ 스터디 생성
exports.createStudy = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      gender_rule,
      duration,
      days,
      capacity,
      host,
    } = req.body;

    if (!title || !description || !category || !host) {
      return res
        .status(400)
        .json({ message: '필수 항목이 누락되었습니다.' });
    }

    const exists = await Study.exists({ title: title.trim() });
    if (exists) {
      return res
        .status(409)
        .json({ message: '이미 존재하는 스터디 이름입니다.' });
    }

    // 스터디 생성
    const newStudy = new Study({
      title,
      description,
      category,
      subCategory,
      gender_rule,
      duration,
      days,
      capacity,
      host,
      members: [host],
    });
    await newStudy.save();

    // 채팅방 자동 생성
    let chatRoom = await ChatRoom.findOne({ studyId: newStudy._id });
    if (!chatRoom) {
      chatRoom = await new ChatRoom({
        studyId: newStudy._id,
        members: [host],
      }).save();
    }

    res.status(201).json({
      message: '스터디 생성 성공',
      study: newStudy,
      chatRoomId: chatRoom._id,
    });
  } catch (err) {
    console.error('❌ 스터디 생성 실패:', err);
    res
      .status(500)
      .json({ message: '스터디 생성 실패', error: err.message });
  }
};

// ✅ 스터디 검색
exports.searchStudies = async (req, res) => {
  try {
    const { category, subCategory, gender_rule, duration } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (gender_rule) filter.gender_rule = gender_rule;
    if (duration) filter.duration = duration;

    const studies = await Study.find(filter).sort({ createdAt: -1 });
    res.json(studies);
  } catch (err) {
    console.error('❌ 스터디 검색 실패:', err);
    res
      .status(500)
      .json({ message: '스터디 검색 실패', error: err.message });
  }
};

// ✅ 스터디 단건 조회
exports.getStudyById = async (req, res) => {
  try {
    const study = await Study.findById(req.params.studyId)
      .populate('host', 'username email')
      .populate('members', 'username email status');

    if (!study) {
      return res
        .status(404)
        .json({ message: '스터디를 찾을 수 없습니다.' });
    }

    res.json(study);
  } catch (err) {
    console.error('❌ 스터디 조회 실패:', err);
    res
      .status(500)
      .json({ message: '스터디 조회 실패', error: err.message });
  }
};

// ✅ 스터디 모집 중단 (스터디장 권한 필요)
exports.stopRecruiting = async (req, res) => {
  try {
    const { studyId } = req.params;
    const study = await Study.findById(studyId);
    if (!study) {
      return res
        .status(404)
        .json({ message: '스터디를 찾을 수 없습니다.' });
    }

    study.isRecruiting = false;
    await study.save();

    res.json({ message: '모집이 중단되었습니다.', study });
  } catch (err) {
    console.error('❌ 모집 중단 실패:', err);
    res
      .status(500)
      .json({ message: '모집 중단 실패', error: err.message });
  }
};

// ✅ 스터디에서 멤버 제거 (방장이 나가면 스터디 + 연관 데이터 전체 삭제)
exports.removeMember = async (req, res) => {
  try {
    const { studyId, memberId } = req.params;

    const study = await Study.findById(studyId);
    if (!study) {
      return res
        .status(404)
        .json({ message: '스터디를 찾을 수 없습니다.' });
    }

    // 🔹 방장이 나가는 경우 → 스터디 전체 삭제(연관 데이터 포함)
    if (study.host.toString() === memberId.toString()) {
      await deleteStudyWithRelations(studyId);
      return res.status(200).json({
        message:
          '방장이 스터디를 나가 스터디와 관련된 모든 데이터가 삭제되었습니다.',
      });
    }

    // 🔹 일반 멤버가 나가는 경우 → members 배열에서만 제거
    const updatedStudy = await Study.findByIdAndUpdate(
      studyId,
      { $pull: { members: memberId } },
      { new: true }
    );

    return res.status(200).json({
      message: '성공적으로 스터디를 나갔습니다.',
      study: updatedStudy,
    });
  } catch (err) {
    console.error('❌ 멤버 제거 실패:', err);
    res
      .status(500)
      .json({ message: '멤버 제거 실패', error: err.message });
  }
};

// ✅ 스터디장 위임
exports.delegateHost = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { newHostId, currentUserId } = req.body;

    const study = await Study.findById(studyId);

    if (!study) {
      return res
        .status(404)
        .json({ message: '스터디를 찾을 수 없습니다.' });
    }

    // 요청자가 현재 스터디 방장인지 확인
    if (study.host.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ message: '방장만 스터디 권한을 위임할 수 있습니다.' });
    }

    // 새로운 방장이 스터디 멤버인지 확인
    if (
      !study.members.some(
        (member) => member.toString() === newHostId.toString()
      )
    ) {
      return res.status(400).json({
        message: '스터디 멤버에게만 방장 권한을 위임할 수 있습니다.',
      });
    }

    // 방장 권한 위임
    study.host = newHostId;
    await study.save();

    res.json({
      message: '방장 권한이 성공적으로 위임되었습니다.',
      newHost: newHostId,
    });
  } catch (err) {
    console.error('❌ 스터디장 위임 실패:', err);
    res
      .status(500)
      .json({ message: '방장 위임 실패', error: err.message });
  }
};

exports.checkTitleDuplicate = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ message: 'title 쿼리 파라미터가 필요합니다.' });
    }
    const exists = await Study.exists({ title: title.trim() });
    return res.json({ available: !exists });
  } catch (err) {
    console.error('❌ 스터디 이름 중복 확인 실패:', err);
    return res
      .status(500)
      .json({ message: '중복 확인 실패', error: err.message });
  }
};

// ✅ 스터디 삭제 (명시적으로 삭제 요청하는 API)
// - 필요하면 프론트에서 DELETE /study/:studyId 로 호출
exports.deleteStudy = async (req, res) => {
  try {
    const { studyId } = req.params;

    const study = await Study.findById(studyId);
    if (!study) {
      return res
        .status(404)
        .json({ message: '스터디를 찾을 수 없습니다.' });
    }

    // (선택) 권한 체크를 추가하고 싶으면 아래처럼 currentUserId 비교하면 됨.
    // const { currentUserId } = req.body;
    // if (currentUserId && study.host.toString() !== currentUserId.toString()) {
    //   return res.status(403).json({ message: '방장만 스터디를 삭제할 수 있습니다.' });
    // }

    await deleteStudyWithRelations(studyId);

    return res.json({
      message: '스터디 및 관련된 모든 데이터가 성공적으로 삭제되었습니다.',
    });
  } catch (err) {
    console.error('❌ 스터디 삭제 실패:', err);
    res
      .status(500)
      .json({ message: '스터디 삭제 실패', error: err.message });
  }
};
