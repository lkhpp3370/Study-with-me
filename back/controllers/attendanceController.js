const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Study = require('../models/Study');
const User = require('../models/User');


/** HH:mm -> {h, m} */
function parseHM(timeStr) {
  if (!timeStr) return null;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;
  return { h, m };
}

/** 날짜 + 시간 문자열을 하나의 Date로 결합 */
function combineDateTime(date, timeStr) {
  const base = new Date(date);
  if (isNaN(base.getTime())) return null;
  const hm = parseHM(timeStr);
  if (!hm) return base;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hm.h, hm.m, 0, 0);
}

/** 🔹 출석 체크 가능 시간인지 검사 (start-5분 ~ end+5분, 자정 넘김 처리 포함) */
function isWithinCheckWindow(schedule) {
  const startDT = combineDateTime(schedule.startDate, schedule.startTime);
  let endDT = combineDateTime(schedule.endDate || schedule.startDate, schedule.endTime);

  if (!startDT || !endDT) return false;

  // 자정 넘김 처리 (예: 23:00 ~ 01:00)
  if (endDT < startDT) {
    endDT = new Date(endDT.getTime() + 24 * 60 * 60 * 1000);
  }

  const windowStart = new Date(startDT.getTime() - 5 * 60 * 1000);
  const windowEnd = new Date(endDT.getTime() + 5 * 60 * 1000);
  const now = new Date();

  return now >= windowStart && now <= windowEnd;
}

/** 🔹 공통 유틸: 지각 가중치 퍼센트 계산 (출석=1, 지각=0.5, 결석=0) */
function calcWeightedPercent(counts = { 출석: 0, 지각: 0, 결석: 0 }) {
  const present = counts.출석 || 0;
  const late = counts.지각 || 0;
  const absent = counts.결석 || 0;
  const total = present + late + absent;
  if (!total) return 0;
  const score = present + late * 0.5;
  return Math.round((score / total) * 1000) / 10; // 소수 1자리
}

/** 🔹 공통 유틸: 출석 카운트 요약 */
function summarize(records) {
  const summary = { 출석: 0, 지각: 0, 결석: 0 };
  for (const r of records) {
    if (summary[r.status] !== undefined) summary[r.status]++;
  }
  return summary;
}

/** ✅ 출석 체크 */
exports.checkAttendance = async (req, res) => {
  try {
    const { scheduleId, userId, status } = req.body;
    if (!scheduleId || !userId || !status) {
      return res.status(400).json({ message: '필수 값이 누락되었습니다.' });
    }

    const schedule = await Schedule.findById(scheduleId).populate('study');
    if (!schedule) return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });

    const checkerId = req.user?._id || req.body.checkerId;
    if (!checkerId) return res.status(401).json({ message: '체크 수행자 정보가 없습니다.' });

    // 개최자만 체크 가능
    if (String(schedule.createdBy) !== String(checkerId)) {
      return res.status(403).json({ message: '출석 체크 권한이 없습니다.' });
    }

    // 체크 가능 시간 제한
    if (!isWithinCheckWindow(schedule)) {
      return res.status(403).json({ message: '출석 체크 가능 시간이 아닙니다.' });
    }

    let record = await Attendance.findOne({ schedule: scheduleId, user: userId });
    if (record) {
      record.status = status;
      await record.save();
    } else {
      record = await Attendance.create({
        schedule: schedule._id,
        study: schedule.study?._id,
        user: userId,
        status,
        scheduleTitle: schedule.title,
        scheduleDate: schedule.startDate,
      });
    }

    res.json(record);
  } catch (err) {
    console.error('❌ 출석 체크 실패:', err);
    res.status(500).json({ message: '출석 체크 실패', error: err.message });
  }
};

/** ✅ 유저별 출석률 */
exports.getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await Attendance.find({ user: userId })
      .populate('study', 'title')
      .sort({ scheduleDate: -1 });

    const summary = summarize(records);
    const percent = calcWeightedPercent(summary);

    res.json({ total: records.length, summary, percent, records });
  } catch (err) {
    res.status(500).json({ message: '유저 출석 조회 실패', error: err.message });
  }
};

/** ✅ 스터디별 출석률 */
exports.getStudyAttendance = async (req, res) => {
  try {
    const { studyId } = req.params;
    const records = await Attendance.find({ study: studyId })
      .populate('user', 'username email')
      .sort({ scheduleDate: -1 });

    const summary = summarize(records);
    const percent = calcWeightedPercent(summary);

    const byUser = {};
    for (const r of records) {
      const uid = String(r.user?._id || r.user);
      const uname = r.user?.username || '알 수 없음';
      if (!byUser[uid]) byUser[uid] = { username: uname, 출석: 0, 지각: 0, 결석: 0 };
      byUser[uid][r.status]++;
    }

    const members = Object.entries(byUser).map(([uid, v]) => ({
      userId: uid,
      username: v.username,
      summary: { 출석: v.출석, 지각: v.지각, 결석: v.결석 },
      percent: calcWeightedPercent(v),
    }));

    res.json({ total: records.length, summary, percent, records, members });
  } catch (err) {
    res.status(500).json({ message: '스터디 출석 조회 실패', error: err.message });
  }
};

/** ✅ 월별 랭킹 */
exports.getMonthlyRanking = async (req, res) => {
  try {
    const { month } = req.params; // YYYY-MM
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const records = await Attendance.find({
      scheduleDate: { $gte: start, $lt: end }
    }).populate('study', 'title');

    const byStudy = {};
    for (const r of records) {
      const sid = String(r.study?._id || r.study);
      const title = r.study?.title || '알 수 없음';
      if (!byStudy[sid]) byStudy[sid] = { study: title, 출석: 0, 지각: 0, 결석: 0 };
      byStudy[sid][r.status]++;
    }

    const result = Object.values(byStudy)
      .map(s => ({ study: s.study, 출석률: calcWeightedPercent(s) }))
      .sort((a, b) => b.출석률 - a.출석률);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '월별 랭킹 조회 실패', error: err.message });
  }
};

/** ✅ 내가 개최한 일정 목록 */
exports.getHostSchedules = async (req, res) => {
  try {
    const { userId } = req.params;
    const schedules = await Schedule.find({ createdBy: userId })
      .populate('study', 'title')
      .sort({ startDate: 1 });

    const now = new Date();
    const future = [];
    const past = [];

    for (const s of schedules) {
      const start = combineDateTime(s.startDate, s.startTime);
      let end = combineDateTime(s.endDate || s.startDate, s.endTime);

      if (!start || !end) continue;
      if (end < start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);

      if (end >= now) {
        future.push({
          _id: s._id,
          title: s.title,
          studyTitle: s.study?.title,
          startDate: s.startDate,
          endDate: s.endDate,
          location: s.location,
          canCheck: isWithinCheckWindow(s),
          type: 'future',
        });
      } else {
        const recs = await Attendance.find({ schedule: s._id });
        const sum = summarize(recs);
        past.push({
          _id: s._id,
          title: s.title,
          studyTitle: s.study?.title,
          startDate: s.startDate,
          endDate: s.endDate,
          location: s.location,
          summary: sum,
          percent: calcWeightedPercent(sum),
          type: 'past',
        });
      }
    }

    future.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    res.json([...future, ...past]);
  } catch (err) {
    res.status(500).json({ message: '개최 일정 조회 실패', error: err.message });
  }
};

/** ✅ 스터디원별 출석률 */
exports.getStudyMembersAttendance = async (req, res) => {
  try {
    const { studyId } = req.params;
    const study = await Study.findById(studyId).populate('members', 'username email');
    if (!study) return res.status(404).json({ message: '스터디를 찾을 수 없습니다.' });

    const records = await Attendance.find({ study: studyId }).populate('user', 'username');

    const byUser = {};
    for (const r of records) {
      const uid = String(r.user?._id || r.user);
      const uname = r.user?.username || '알 수 없음';
      if (!byUser[uid]) byUser[uid] = { username: uname, 출석: 0, 지각: 0, 결석: 0 };
      byUser[uid][r.status]++;
    }

    const members = (study.members || []).map(m => {
      const uid = String(m._id);
      const sum = byUser[uid] || { username: m.username, 출석: 0, 지각: 0, 결석: 0 };
      return {
        userId: uid,
        username: sum.username,
        summary: { 출석: sum.출석, 지각: sum.지각, 결석: sum.결석 },
        percent: calcWeightedPercent(sum),
      };
    });

    for (const [uid, v] of Object.entries(byUser)) {
      if (!members.find(m => m.userId === uid)) {
        members.push({
          userId: uid,
          username: v.username,
          summary: { 출석: v.출석, 지각: v.지각, 결석: v.결석 },
          percent: calcWeightedPercent(v),
        });
      }
    }

    members.sort((a, b) => b.percent - a.percent);
    res.json({ study: study.title, totalMembers: members.length, members });
  } catch (err) {
    res.status(500).json({ message: '스터디원 출석률 조회 실패', error: err.message });
  }
};

/** ✅ 유저 상세 출석 + 퍼센트 */
exports.getUserAttendanceDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await Attendance.find({ user: userId })
      .populate('study', 'title')
      .sort({ scheduleDate: -1 });

    const summary = summarize(records);
    const percent = calcWeightedPercent(summary);

    res.json({ total: records.length, summary, percent, records });
  } catch (err) {
    res.status(500).json({ message: '유저 출석 상세 조회 실패', error: err.message });
  }
};

/** ✅ 특정 스터디의 전체 랭킹 위치 */
exports.getStudyGlobalRank = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { month } = req.query; // YYYY-MM

    const now = month ? new Date(`${month}-01T00:00:00`) : new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const records = await Attendance.find({
      scheduleDate: { $gte: start, $lt: end }
    }).populate('study', 'title');

    const byStudy = {};
    for (const r of records) {
      const sid = String(r.study?._id || r.study);
      const title = r.study?.title || '알 수 없음';
      if (!byStudy[sid]) byStudy[sid] = { studyId: sid, title, 출석: 0, 지각: 0, 결석: 0 };
      byStudy[sid][r.status]++;
    }

    const ranking = Object.values(byStudy)
      .map(s => ({
        studyId: s.studyId,
        title: s.title,
        출석률: calcWeightedPercent(s)
      }))
      .sort((a, b) => b.출석률 - a.출석률);

    const index = ranking.findIndex(r => r.studyId === String(studyId));
    if (index === -1) {
      return res.status(404).json({ message: '해당 스터디의 랭킹을 찾을 수 없습니다.' });
    }

    res.json({
      rank: index + 1,
      total: ranking.length,
      studyId,
      title: ranking[index].title,
      출석률: ranking[index].출석률
    });
  } catch (err) {
    console.error('❌ 스터디 글로벌 랭킹 실패:', err);
    res.status(500).json({ message: '스터디 글로벌 랭킹 실패', error: err.message });
  }
};

// 🔹 다른 컨트롤러에서도 쓸 수 있도록 export
exports.isWithinCheckWindow = isWithinCheckWindow;
