const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const rooms = await ChatRoom.find({ members: userId })
      .populate('studyId', 'title')
      .sort({ lastMessageAt: -1 });

    const roomData = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await Message.countDocuments({
          chatRoomId: room._id,
          readBy: { $ne: userId },
        });

        const lastMsg = await Message.findOne({ chatRoomId: room._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'username');

        return {
          _id: room._id,
          studyId: room.studyId,
          lastMessage: lastMsg?.content || '',
          lastMessageSender: lastMsg?.sender?.username || '',
          lastMessageAt: room.lastMessageAt,
          unreadCount,
        };
      })
    );

    res.json(roomData);
  } catch (err) {
    console.error('❌ 채팅방 목록 조회 실패:', err.message);
    res.status(500).json({ error: '채팅방 목록을 불러올 수 없습니다.' });
  }
});

router.get('/:roomId', async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId).populate('studyId');
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: '채팅방 정보 조회 실패' });
  }
});

module.exports = router;
