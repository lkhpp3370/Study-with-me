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

    // 1. 이미 멤버인지 확인 (Study 모델 기준)
    if (study.members.map(String).includes(String(userId))) {
      return res.status(400).json({ message: '이미 스터디 멤버입니다.' });
    }
    
    // ⭐ 2. StudyApplication 상태 확인: 'pending', 'approved', 'rejected' 모두 조회
    const existingApp = await StudyApplication.findOne({ study: studyId, applicant: userId });
    
    if (existingApp) {
        if (existingApp.status === 'pending') {
            // 'pending' 상태는 현재 신청 중이므로 재신청을 막음
            return res.status(400).json({ message: '이미 신청 상태입니다.' });
        }
        await StudyApplication.deleteOne({ _id: existingApp._id }); 
    }
    
    // 3. 모집 중인지 & 정원 확인
    if (!study.isRecruiting) return res.status(400).json({ message: '현재 모집 중이 아닙니다.' });
    if (study.capacity > 0 && study.members.length >= study.capacity) {
      return res.status(400).json({ message: '정원이 가득 찼습니다.' });
    }
    // 4. 새 신청서 생성
    const app = await StudyApplication.create({
      study: studyId,
      applicant: userId,
      message: message || '',
    });

    res.status(201).json({ message: '가입 신청 완료', application: app });
  } catch (err) {
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

exports.getApplicationStatus = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { userId } = req.query; 

    if (!userId) {
        return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    // 해당 스터디와 사용자에 대한 신청서를 찾습니다.
    const application = await StudyApplication.findOne({ 
        study: studyId, 
        applicant: userId 
    }).select('status'); // status 필드만 선택하여 효율을 높입니다.

    // 신청서가 없으면 'none', 있으면 해당 status를 반환합니다.
    const status = application ? application.status : 'none';

    // 응답: { status: 'pending' | 'approved' | 'rejected' | 'none' }
    res.json({ status });
  } catch (err) {
    console.error('❌ 신청 상태 조회 실패:', err);
    res.status(500).json({ message: '신청 상태 조회 실패', error: err.message });
  }
};

exports.listMyPending = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    const rows = await StudyApplication.find({ applicant: userId, status: 'pending' })
      .populate('study', 'title capacity members host') // 스터디의 제목 등 필요한 정보만 가져옵니다.
      .sort({ createdAt: -1 });

    res.json(rows);
  } catch (err) {
    console.error('❌ 내 신청 목록 조회 실패:', err);
    res.status(500).json({ message: '내 신청 목록 조회 실패', error: err.message });
  }
};

exports.listHostPending = async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(400).json({ message: 'hostId가 필요합니다.' });
    }

    // ⭐ 1. hostId가 호스트인 모든 스터디 목록을 찾습니다.
    const myStudies = await Study.find({ host: hostId })
      .select('_id title members host')
      .populate('members', '_id username grade major gender') 
      .lean(); 

    if (myStudies.length === 0) {
      return res.json([]);
    }

    const myStudyIds = myStudies.map(study => study._id);

    // 2. 이 스터디들에 대한 'pending' 상태의 StudyApplication 개수를 스터디별로 집계합니다.
    const pendingCounts = await StudyApplication.aggregate([
      { $match: { study: { $in: myStudyIds }, status: 'pending' } },
      { $group: { _id: '$study', count: { $sum: 1 } } },
    ]);
    
    // 3. 스터디 목록에 대기 건수(count)를 병합하고 반환합니다.
    const result = myStudies.map(study => {
      const pendingItem = pendingCounts.find(item => String(item._id) === String(study._id));
      
      return {
        ...study, // Populate된 members 필드 (이름 정보 포함)를 그대로 사용합니다.
        count: pendingItem ? pendingItem.count : 0, // 대기 건수
      };
    });

    // 응답 형태: [{ _id, title, members, host, count, membersForNav }, ...]
    res.json(result);
  } catch (err) {
    console.error('❌ 호스트 대기 목록 조회 실패:', err);
    res.status(500).json({ message: '호스트 대기 목록 조회 실패', error: err.message });
  }
};
