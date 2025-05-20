const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Study = require('../models/Study');
const User = require('../models/User');

// 📌 공지 작성
router.post('/:roomId/notice', async (req, res) => {
  const { senderId, content } = req.body;
  try {
    const chatRoom = await ChatRoom.findById(req.params.roomId).populate('studyId');
    const study = await Study.findById(chatRoom.studyId);
    if (!study.leader.equals(senderId)) return res.status(403).json({ error: '권한 없음' });
    if (chatRoom.noticeMessageId) await Message.findByIdAndDelete(chatRoom.noticeMessageId);
    const newNotice = await Message.create({
      chatRoomId: req.params.roomId, sender: senderId, type: 'notice', content,
    });
    chatRoom.noticeMessageId = newNotice._id;
    await chatRoom.save();
    res.json(newNotice);
  } catch (err) {
    res.status(500).json({ error: '공지 작성 실패' });
  }
});

// 📌 공지 조회
router.get('/:roomId/notice', async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room.noticeMessageId) return res.json(null);
    const notice = await Message.findById(room.noticeMessageId).populate('sender', 'username');
    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: '공지 조회 실패' });
  }
});

// 🔕 알림 설정 조회
router.get('/:userId/notifications', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const prefs = user.chatNotificationPreferences || {};
    res.json(Object.fromEntries(prefs));
  } catch (err) {
    res.status(500).json({ error: '알림 설정 조회 실패' });
  }
});

// 🔕 알림 설정 변경
router.patch('/:userId/notifications', async (req, res) => {
  const { roomId, enabled } = req.body;
  try {
    const user = await User.findById(req.params.userId);
    user.chatNotificationPreferences.set(roomId, enabled);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '알림 설정 변경 실패' });
  }
});

// 🗳️ 투표 생성
router.post('/:roomId/vote', async (req, res) => {
  const { senderId, content, voteOptions, voteDeadline } = req.body;
  try {
    const newVote = await Message.create({
      chatRoomId: req.params.roomId,
      sender: senderId,
      type: 'vote',
      content,
      voteOptions,
      voteDeadline,
    });
    res.json(newVote);
  } catch (err) {
    res.status(500).json({ error: '투표 생성 실패' });
  }
});

// 🗳️ 투표 참여
router.post('/vote/:messageId', async (req, res) => {
  const { userId, selectedIndex } = req.body;
  try {
    const message = await Message.findById(req.params.messageId);
    if (message.type !== 'vote') return res.status(400).json({ error: '유효하지 않은 메시지' });
    if (message.voteDeadline && message.voteDeadline < new Date()) {
      return res.status(400).json({ error: '투표 마감됨' });
    }
    message.voteResult.set(userId, selectedIndex);
    await message.save();
    res.json({ success: true, voteResult: Object.fromEntries(message.voteResult) });
  } catch (err) {
    res.status(500).json({ error: '투표 실패' });
  }
});

// ✅ 메시지 목록 조회
router.get('/:roomId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ chatRoomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username');
    res.json(messages);
  } catch (err) {
    console.error('❌ 메시지 조회 실패:', err.message);
    res.status(500).json({ error: '메시지 조회 실패' });
  }
});

// ✅ 읽음 처리
router.patch('/:roomId/read', async (req, res) => {
  const { userId } = req.body;
  try {
    await Message.updateMany(
      { chatRoomId: req.params.roomId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '읽음 처리 실패' });
  }
});

module.exports = router;
