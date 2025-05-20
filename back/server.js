const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const ip = require('ip');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const User = require('./models/User');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.use('/profile', require('./routes/profile'));
app.use('/main', require('./routes/main'));
app.use('/auth', require('./routes/auth'));
app.use('/studies', require('./routes/study'));
app.use('/schedule', require('./routes/schedule'));
app.use('/notification', require('./routes/notification'));
app.use('/chat', require('./routes/chat'));
app.use('/chatroom', require('./routes/chatroom'));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://192.168.45.173:27017/studywithme';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('🟢 유저 연결됨:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`➡️ 채팅방 입장: ${roomId}`);
  });

  socket.on('sendMessage', async ({ roomId, senderId, message, type = 'text' }) => {
    try {
      const savedMessage = await Message.create({
        chatRoomId: roomId,
        sender: senderId,
        type,
        content: message,
      });

      await ChatRoom.findByIdAndUpdate(roomId, {
        lastMessage: type === 'image' ? '[이미지]' : message,
        lastMessageAt: new Date()
      });

      io.to(roomId).emit('receiveMessage', savedMessage);

      const chatRoom = await ChatRoom.findById(roomId);
      for (const userId of chatRoom.members) {
        if (userId.toString() !== senderId) {
          const user = await User.findById(userId);
          const prefs = user.chatNotificationPreferences || {};
          if (prefs.get(roomId.toString()) !== false) {
            console.log(`🔔 알림 전송 대상 유저: ${user.username}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ 메시지 저장 실패:', err.message);
    }
  });

  socket.on('readMessage', async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message.readBy.map(id => id.toString()).includes(userId)) {
        message.readBy.push(userId);
        await message.save();
        io.to(message.chatRoomId.toString()).emit('updateReadCount', {
          messageId,
          readCount: message.readBy.length
        });
      }
    } catch (err) {
      console.error('❌ 읽음 처리 실패:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 유저 연결 종료:', socket.id);
  });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ 서버 실행 중`);
      console.log(` → Local:   http://localhost:${PORT}`);
      console.log(` → Network: http://${ip.address()}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err.message);
  });
