const Study = require('../models/Study');
const ChatRoom = require('../models/ChatRoom');
const StudyApplication = require('../models/StudyApplication');

// POST /applications/:studyId/apply   body: { userId, message? }
exports.apply = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { userId, message } = req.body;

    const study = await Study.findById(studyId);
    if (!study) return res.status(404).json({ message: '스터디가 존재하지 않습니다.' });

    // 이미 멤버인지
    if (study.members.map(String).includes(String(userId))) {
      return res.status(400).json({ message: '이미 스터디 멤버입니다.' });
    }

    // 모집 중인지 & 정원
    if (!study.isRecruiting) return res.status(400).json({ message: '현재 모집 중이 아닙니다.' });
    if (study.capacity > 0 && study.members.length >= study.capacity) {
      return res.status(400).json({ message: '정원이 가득 찼습니다.' });
    }

    const app = await StudyApplication.create({
      study: studyId,
      applicant: userId,
      message: message || '',
    });

    res.status(201).json({ message: '가입 신청 완료', application: app });
  } catch (err) {
    // 중복 unique 충돌 처리
    if (err.code === 11000) {
      return res.status(400).json({ message: '이미 신청 상태입니다.' });
    }
    console.error('❌ 가입 신청 실패:', err);
    res.status(500).json({ message: '가입 신청 실패', error: err.message });
  }
};

// GET /applications/:studyId/pending   (스터디장 전용)
exports.listPending = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { hostId } = req.query;

    const study = await Study.findById(studyId);
    if (!study) return res.status(404).json({ message: '스터디가 존재하지 않습니다.' });
    if (String(study.host) !== String(hostId)) {
      return res.status(403).json({ message: '호스트만 조회 가능합니다.' });
    }

    const rows = await StudyApplication.find({ study: studyId, status: 'pending' })
      .populate('applicant', 'username grade major gender')
      .sort({ createdAt: -1 });

    res.json(rows);
  } catch (err) {
    console.error('❌ 신청 목록 조회 실패:', err);
    res.status(500).json({ message: '신청 목록 조회 실패', error: err.message });
  }
};

// PATCH /applications/:applicationId/approve  (호스트)
exports.approve = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { hostId } = req.body;

    const app = await StudyApplication.findById(applicationId).populate('study');
    if (!app) return res.status(404).json({ message: '신청이 존재하지 않습니다.' });

    const study = app.study;
    if (String(study.host) !== String(hostId)) {
      return res.status(403).json({ message: '호스트만 승인할 수 있습니다.' });
    }
    if (app.status !== 'pending') {
      return res.status(400).json({ message: '이미 처리된 신청입니다.' });
    }

    // 멤버 추가
    if (!study.members.map(String).includes(String(app.applicant))) {
      study.members.push(app.applicant);
    }

    // 정원 체크 → 모집 종료
    if (study.capacity > 0 && study.members.length >= study.capacity) {
      study.isRecruiting = false;
    }
    await study.save();

    // 채팅방 멤버에도 추가
    let room = await ChatRoom.findOne({ studyId: study._id });
    if (!room) {
      room = await new ChatRoom({ studyId: study._id, members: study.members }).save();
    } else if (!room.members.map(String).includes(String(app.applicant))) {
      room.members.push(app.applicant);
      await room.save();
    }

    app.status = 'approved';
    await app.save();

    res.json({ message: '승인 완료', studyId: study._id, roomId: room._id });
  } catch (err) {
    console.error('❌ 승인 실패:', err);
    res.status(500).json({ message: '승인 실패', error: err.message });
  }
};

// PATCH /applications/:applicationId/reject (호스트)
exports.reject = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { hostId } = req.body;

    const app = await StudyApplication.findById(applicationId).populate('study');
    if (!app) return res.status(404).json({ message: '신청이 존재하지 않습니다.' });

    const study = app.study;
    if (String(study.host) !== String(hostId)) {
      return res.status(403).json({ message: '호스트만 거절할 수 있습니다.' });
    }
    if (app.status !== 'pending') {
      return res.status(400).json({ message: '이미 처리된 신청입니다.' });
    }

    app.status = 'rejected';
    await app.save();

    res.json({ message: '거절 완료' });
  } catch (err) {
    console.error('❌ 거절 실패:', err);
    res.status(500).json({ message: '거절 실패', error: err.message });
  }
};
