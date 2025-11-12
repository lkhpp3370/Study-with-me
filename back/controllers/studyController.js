const Study = require('../models/Study');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

// ✅ 스터디 생성
exports.createStudy = async (req, res) => {
  try {
    const {
      title, description,
      category, subCategory,
      gender_rule, duration, days,
      capacity, host
    } = req.body;

    if (!title || !description || !category || !host) {
      return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    }

    const exists = await Study.exists({ title: title.trim() });
    if (exists) {
      return res.status(409).json({ message: '이미 존재하는 스터디 이름입니다.' });
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
      members: [host]
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
    res.status(500).json({ message: '스터디 생성 실패', error: err.message });
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
    res.status(500).json({ message: '스터디 검색 실패', error: err.message });
  }
};

// ✅ 스터디 단건 조회
exports.getStudyById = async (req, res) => {
  try {
    const study = await Study.findById(req.params.studyId)
      .populate('host', 'username email')
      .populate('members', 'username email status');

    if (!study) return res.status(404).json({ message: '스터디를 찾을 수 없습니다.' });

    res.json(study);
  } catch (err) {
    console.error('❌ 스터디 조회 실패:', err);
    res.status(500).json({ message: '스터디 조회 실패', error: err.message });
  }
};

// ✅ 스터디 모집 중단 (스터디장 권한 필요)
exports.stopRecruiting = async (req, res) => {
  try {
    const { studyId } = req.params;
    const study = await Study.findById(studyId);
    if (!study) return res.status(404).json({ message: '스터디를 찾을 수 없습니다.' });

    study.isRecruiting = false;
    await study.save();

    res.json({ message: '모집이 중단되었습니다.', study });
  } catch (err) {
    console.error('❌ 모집 중단 실패:', err);
    res.status(500).json({ message: '모집 중단 실패', error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { studyId, memberId } = req.params;

    const study = await Study.findById(studyId);
    if (!study) {
      return res.status(404).json({ message: '스터디를 찾을 수 없습니다.' });
    }

    // 스터디 멤버 목록에서 memberId 제거
    const updatedStudy = await Study.findByIdAndUpdate(
      studyId,
      { $pull: { members: memberId } },
      { new: true }
    );
    
    // 호스트가 나갈 경우 스터디 삭제
    if (study.host.toString() === memberId) {
        await Study.findByIdAndDelete(studyId);
        return res.status(200).json({ message: '방장이 스터디를 나가 스터디가 삭제되었습니다.' });
    }

    res.status(200).json({ message: '성공적으로 스터디를 나갔습니다.', study: updatedStudy });
  } catch (err) {
    console.error('❌ 멤버 제거 실패:', err);
    res.status(500).json({ message: '멤버 제거 실패', error: err.message });
  }
};

// ✅ 스터디장 위임
exports.delegateHost = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { newHostId, currentUserId } = req.body;

    const study = await Study.findById(studyId);

    if (!study) {
      return res.status(404).json({ message: '스터디를 찾을 수 없습니다.' });
    }

    // 요청자가 현재 스터디 방장인지 확인
    if (study.host.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: '방장만 스터디 권한을 위임할 수 있습니다.' });
    }

    // 새로운 방장이 스터디 멤버인지 확인
    if (!study.members.some(member => member.toString() === newHostId.toString())) {
        return res.status(400).json({ message: '스터디 멤버에게만 방장 권한을 위임할 수 있습니다.' });
    }

    // 방장 권한 위임
    study.host = newHostId;
    await study.save();

    res.json({ message: '방장 권한이 성공적으로 위임되었습니다.', newHost: newHostId });

  } catch (err) {
    console.error('❌ 스터디장 위임 실패:', err);
    res.status(500).json({ message: '방장 위임 실패', error: err.message });
  }
};

exports.checkTitleDuplicate = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'title 쿼리 파라미터가 필요합니다.' });
    }
    const exists = await Study.exists({ title: title.trim() });
    return res.json({ available: !exists });
  } catch (err) {
    console.error('❌ 스터디 이름 중복 확인 실패:', err);
    return res.status(500).json({ message: '중복 확인 실패', error: err.message });
  }
};