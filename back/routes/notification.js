const express = require('express');
const router = express.Router();
const notiController = require('../controllers/notificationController');

// 알림 생성
router.post('/', notiController.createNotification);

// 사용자 알림 목록 조회
router.get('/:userId', notiController.getUserNotifications);

// 알림 읽음 처리
router.patch('/read/:notiId', notiController.markAsRead);

// ✅ 사용자 전체 알림 읽음 처리
router.patch('/user/:userId/readAll', notiController.markAllAsRead);

module.exports = router;
