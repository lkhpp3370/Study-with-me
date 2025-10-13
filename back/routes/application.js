const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

// 가입 신청
router.post('/:studyId/apply', applicationController.apply);

// 대기 목록(호스트)
router.get('/:studyId/pending', applicationController.listPending);

// ⭐ 새로운 API 추가: 특정 사용자의 신청 상태 조회
router.get('/:studyId/status', applicationController.getApplicationStatus);

// 승인/거절(호스트)
router.patch('/:applicationId/approve', applicationController.approve);
router.patch('/:applicationId/reject',  applicationController.reject);

// 내가 신청한 스터디 목록 & 내가 호스트인 스터디의 대기 목록
router.get('/my-pending', applicationController.listMyPending);
router.get('/host-pending', applicationController.listHostPending);

module.exports = router;
