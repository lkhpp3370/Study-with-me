const Schedule = require('../models/Schedule');
const Study = require('../models/Study');
const User = require('../models/User');
const { sendNotification } = require('../utils/notify');

// ✅ 특정 스터디의 일정 등록
exports.createSchedule = async (req, res) => {
  try {
    const { studyId, title, description, start, end, location, userId } = req.body;

    // 해당 스터디 존재 여부 확인
    const study = await Study.findById(studyId).populate('members');
    if (!study) return res.status(404).json({ message: '스터디가 존재하지 않습니다.' });

    // 일정 등록
    const schedule = new Schedule({
      study: studyId,
      title,
      description,
      start,
      end,
      location,
      createdBy: userId,
    });
    await schedule.save();

    // ✅ 알림 전송 (스터디 구성원 중 본인 제외)
    for (const member of study.members) {
      if (String(member._id) !== userId) {
        await sendNotification(
          member._id,
          'schedule',
          `[${study.title}]에 새 일정이 등록되었습니다: ${title}`,
          schedule._id,
          'Schedule'
        );
      }
    }

    res.status(201).json({ message: '일정 등록 성공', schedule });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// ✅ 특정 스터디의 일정 목록 조회
exports.getStudySchedules = async (req, res) => {
  try {
    const { studyId } = req.params;
    const schedules = await Schedule.find({ study: studyId }).sort('start');
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// ✅ 사용자의 전체 스터디 일정 조회 (메인 페이지용)
exports.getUserSchedules = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('joinedStudies');

    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const studyIds = user.joinedStudies.map(s => s._id);
    const schedules = await Schedule.find({ study: { $in: studyIds } })
      .sort('start')
      .populate('study', 'title');  // 스터디 이름 포함
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};
