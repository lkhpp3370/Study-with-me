const Schedule = require('../models/Schedule');
const Study = require('../models/Study');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { sendNotification } = require('../utils/notify');
const { isWithinCheckWindow } = require('./attendanceController');

/** 📌 일정 등록 */
exports.createSchedule = async (req, res) => {
  try {
    const {
      studyId, title, description,
      dayOfWeek, startDate, startTime, endTime,
      repeatWeekly = false, location, userId, capacity = 0
    } = req.body;

    const study = await Study.findById(studyId).populate('members');
    if (!study) return res.status(404).json({ message: '스터디가 존재하지 않습니다.' });

    const schedule = new Schedule({
      study: studyId,
      title,
      description,
      dayOfWeek,
      startDate,
      startTime,
      endTime,
      repeatWeekly,
      location,
      createdBy: userId,
      capacity,
      participants: []
    });
    await schedule.save();

    // 알림 전송
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
    console.error('❌ 일정 등록 실패:', err.message);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

/** 📌 특정 스터디 일정 조회 */
exports.getStudySchedules = async (req, res) => {
  try {
    const { studyId } = req.params;
    const schedules = await Schedule.find({ study: studyId })
      .sort({ startDate: 1, startTime: 1 })
      .populate('participants', 'username email');
    res.json(schedules);
  } catch (err) {
    console.error('❌ 스터디 일정 조회 실패:', err.message);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

/** 📌 사용자의 전체 스터디 일정 조회 (메인 페이지용) */
exports.getUserSchedules = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('joinedStudies');
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const studyIds = user.joinedStudies.map(s => s._id);
    const schedules = await Schedule.find({ study: { $in: studyIds } })
      .sort({ startDate: 1, startTime: 1 })
      .populate('study', 'title')
      .populate('participants', 'username');
    res.json(schedules);
  } catch (err) {
    console.error('❌ 사용자 일정 조회 실패:', err.message);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

/** 📌 일정 참여 신청 */
exports.joinSchedule = async (req, res) => {
  try {
    const { scheduleId, userId } = req.body;

    const schedule = await Schedule.findById(scheduleId).populate('participants');
    if (!schedule) return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });

    if (schedule.participants.some(p => String(p._id) === String(userId))) {
      return res.status(400).json({ message: '이미 참여 신청한 일정입니다.' });
    }

    if (schedule.capacity > 0 && schedule.participants.length >= schedule.capacity) {
      return res.status(400).json({ message: '참여 인원이 가득 찼습니다.' });
    }

    schedule.participants.push(userId);
    await schedule.save();

    res.json({ message: '일정 참여 신청 성공', schedule });
  } catch (err) {
    console.error('❌ 일정 참여 신청 실패:', err.message);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

/** 📌 일정 참여 취소 */
exports.leaveSchedule = async (req, res) => {
  try {
    const { scheduleId, userId } = req.body;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });

    if (!schedule.participants.some(p => String(p) === String(userId))) {
      return res.status(403).json({ message: '참여하지 않은 일정은 취소할 수 없습니다.' });
    }

    schedule.participants = schedule.participants.filter(p => String(p) !== String(userId));
    await schedule.save();

    res.json({ message: '일정 참여 취소 성공', schedule });
  } catch (err) {
    console.error('❌ 일정 참여 취소 실패:', err.message);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

/** 📌 내가 개최한 일정 조회 */
exports.getSchedulesByCreator = async (req, res) => {
  try {
    const { userId } = req.params;
    const schedules = await Schedule.find({ createdBy: userId })
      .sort({ startDate: 1, startTime: 1 })
      .populate('study', 'title')
      .populate('participants', 'username email');

    res.json(schedules);
  } catch (err) {
    console.error('❌ 내가 개최한 일정 조회 실패:', err.message);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

/** 📌 일정 단건 조회 (참여자 + 출석체크 가능 여부 + 출석 상태 포함) */
exports.getScheduleById = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findById(scheduleId)
      .populate('participants', 'username email')
      .populate('study', 'title');

    if (!schedule) return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });

    // ✅ 출석 기록 가져오기
    const attendances = await Attendance.find({ schedule: scheduleId }).lean();

    // ✅ participants와 출석 기록 merge
    const participants = schedule.participants.map((p) => {
      const rec = attendances.find(a => String(a.user) === String(p._id));
      return {
        ...p.toObject(),
        status: rec?.status || null,   // 출석 상태 (출석/지각/결석)
      };
    });

    const canCheck = isWithinCheckWindow(schedule);

    res.json({
      ...schedule.toObject(),
      participants,
      canCheck,
    });
  } catch (err) {
    console.error('❌ 일정 단건 조회 실패:', err.message);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};