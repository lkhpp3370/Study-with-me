const Notification = require('../models/Notification');

// ✅ 알림 생성
exports.createNotification = async (req, res) => {
  try {
    const { user, type, content } = req.body;
    const notification = new Notification({ user, type, content });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: '알림 생성 실패', error: err.message });
  }
};

// ✅ 사용자 알림 조회
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    const notis = await Notification.find({ user: userId }).sort('-createdAt');
    res.json(notis);
  } catch (err) {
    res.status(500).json({ message: '알림 조회 실패', error: err.message });
  }
};

// ✅ 알림 읽음 처리
exports.markAsRead = async (req, res) => {
  try {
    const notiId = req.params.notiId;
    await Notification.findByIdAndUpdate(notiId, { isRead: true });
    res.json({ message: '알림 읽음 처리됨' });
  } catch (err) {
    res.status(500).json({ message: '읽음 처리 실패', error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
    res.json({ message: '전체 알림 읽음 처리 완료' });
  } catch (err) {
    res.status(500).json({ message: '전체 읽음 처리 실패', error: err.message });
  }
};
