const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

// 가입 신청
router.post('/:studyId/apply', applicationController.apply);

// 대기 목록(호스트)
router.get('/:studyId/pending', applicationController.listPending);

// 승인/거절(호스트)
router.patch('/:applicationId/approve', applicationController.approve);
router.patch('/:applicationId/reject',  applicationController.reject);

module.exports = router;
