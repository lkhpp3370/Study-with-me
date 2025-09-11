const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// ✅ 출석 체크
router.post('/check', attendanceController.checkAttendance);

// ✅ 유저별 출석률
router.get('/user/:userId', attendanceController.getUserAttendance);

// ✅ 스터디별 출석률
router.get('/study/:studyId', attendanceController.getStudyAttendance);

// ✅ 월별 전체 랭킹 (예: /attendance/ranking/2025-09)
router.get('/ranking/:month', attendanceController.getMonthlyRanking);

// ✅ 특정 스터디의 글로벌 랭킹 위치 (예: /attendance/study/123/global-rank?month=2025-09)
router.get('/study/:studyId/global-rank', attendanceController.getStudyGlobalRank);

// ✅ 내가 개최한 일정 목록
router.get('/host/:userId/schedules', attendanceController.getHostSchedules);

// ✅ 스터디원별 출석률
router.get('/study/:studyId/members', attendanceController.getStudyMembersAttendance);

// ✅ 유저 상세 출석 + 퍼센트
router.get('/user/:userId/detail', attendanceController.getUserAttendanceDetail);

module.exports = router;
