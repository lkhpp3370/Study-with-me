// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const ip = require('ip');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const User = require('./models/User');

dotenv.config();
const app = express();

// ✅ CORS (credentials + origin은 호환 주의)
app.use(cors({
  origin: [
    'http://localhost:19006', // Expo 웹
    'http://192.168.45.173:19006' // 같은 네트워크의 Expo 앱
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 세션 미들웨어 (선택사항: JWT로 대체 가능)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studywithme';
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1일
}));

// 기본 라우트
app.get('/', (req, res) => res.send('Backend server is running!'));

// 📌 기존 라우트
app.use('/profile', require('./routes/profile'));
app.use('/main', require('./routes/main'));
app.use('/auth', require('./routes/auth'));
app.use('/studies', require('./routes/study'));
app.use('/schedule', require('./routes/schedule'));
app.use('/notification', require('./routes/notification'));
app.use('/chat', require('./routes/chat'));
app.use('/chatroom', require('./routes/chatroom'));
app.use('/routine', require('./routes/routine'));
app.use('/attendance', require('./routes/attendance'));
app.use('/reviews', require('./routes/review'));       // 일반 리뷰
app.use('/comments', require('./routes/comment'));
app.use('/applications', require('./routes/application'));

// ✅ 장소 추천 관련 라우트
app.use('/places', require('./routes/place'));
app.use('/place-reviews', require('./routes/placeReview')); // ⚡ 경로 충돌 방지
app.use('/favorites', require('./routes/favorite'));

// ✅ 김현서 프로젝트에서 가져온 라우트
app.use('/material', require('./routes/material'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/folder', require('./routes/folder'));
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ✅ 소켓 이벤트
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

      // ✅ lastMessage 미리보기
      let preview = '';
      if (type === 'image') preview = '[이미지]';
      else if (type === 'vote') preview = '[투표]';
      else preview = message.length > 30 ? message.slice(0, 15) + '...' : message;

      await ChatRoom.findByIdAndUpdate(roomId, {
        lastMessage: preview,
        lastMessageAt: new Date(),
      });

      io.to(roomId).emit('receiveMessage', savedMessage);

      // 알림 처리 (추후 푸시 알림 연동 예정)
      const chatRoom = await ChatRoom.findById(roomId);
      for (const userId of chatRoom.members) {
        if (userId.toString() !== senderId) {
          const user = await User.findById(userId);
          const prefs = user.chatNotificationPreferences || {};
          if (prefs.get(roomId.toString()) !== false) {
            console.log(`🔔 알림 전송 대상: ${user.username}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ 메시지 저장 실패:', err.message);
      socket.emit('error', { message: '메시지 저장 실패' }); // 클라이언트에도 에러 전달
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
          readCount: message.readBy.length,
        });
      }
    } catch (err) {
      console.error('❌ 읽음 처리 실패:', err.message);
      socket.emit('error', { message: '읽음 처리 실패' });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 유저 연결 종료:', socket.id);
  });
});

// ✅ MongoDB 연결
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
