// routes/chatroom.js - 최종 완성본
const express = require('express'); 
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Study = require('../models/Study');
const Message = require('../models/Message');
const User = require('../models/User');

// ✅ 특정 유저가 참여 중인 채팅방 목록 조회
// ✅ 특정 유저가 참여 중인 채팅방 목록 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const rooms = await ChatRoom.find({ members: userId })
      .populate('studyId', 'title host')
      .sort({ lastMessageAt: -1 });

    const results = await Promise.all(
      rooms.map(async (room) => {
        const unread = await Message.countDocuments({
          chatRoomId: room._id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        });

        // ✅ 마지막 메시지 안전하게 가져오기
        const lastMsg = await Message.findOne({ chatRoomId: room._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'username');

        return {
          _id: room._id,
          studyTitle: room.studyId?.title || '알 수 없음',
          lastMessage: lastMsg ? lastMsg.content : '',
          lastSenderName: lastMsg?.sender?.username || '',
          lastMessageAt: lastMsg ? lastMsg.createdAt : room.lastMessageAt,
          unreadCount: unread,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error('❌ 채팅방 목록 조회 실패:', err);
    res.status(500).json({ message: '채팅방 목록 조회 실패', error: err.message });
  }
});


// ✅ 채팅방별 알림 설정 On/Off
router.patch('/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomId, enabled } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: '유저를 찾을 수 없습니다' });

    if (!user.chatNotificationPreferences) user.chatNotificationPreferences = new Map();
    user.chatNotificationPreferences.set(roomId, enabled);
    await user.save();

    res.json({ message: '알림 설정이 변경되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '알림 설정 실패', error: err.message });
  }
});

// ✅ 채팅방의 스터디 호스트 ID 반환
router.get('/:roomId/host', async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId).populate('studyId');
    if (!room || !room.studyId || !room.studyId.host) {
      return res.status(404).json({ error: '스터디나 호스트 정보가 없습니다.' });
    }
    res.json({ hostId: room.studyId.host.toString() });
  } catch (err) {
    res.status(500).json({ error: '서버 오류', details: err.message });
  }
});

module.exports = router;
