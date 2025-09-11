const Study = require('../models/Study');
const ChatRoom = require('../models/ChatRoom');   // ✅ 추가
const Message = require('../models/Message');     // ✅ 추가

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

      const notice = await new Message({
        chatRoomId: chatRoom._id,
        sender: host,
        type: 'notice',
        content: `[${title}] 스터디 채팅방이 생성되었습니다.`,
      }).save();

      chatRoom.noticeMessageId = notice._id;
      await chatRoom.save();
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
      .populate('host', 'username email')      // ⬅️ 추가
      .populate('members', 'username email');

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
