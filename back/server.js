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
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ 업로드 디렉터리 생성 완료:', uploadDir);
}

// ✅ CORS + 세션
app.use(cors({
  origin: 'exp://192.168.127.9:8081',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = "mongodb+srv://202011630_db_user:202011630_rlagustj@cluster0.gbsiqft.mongodb.net/"
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// 기본 라우트
app.get('/', (req, res) => res.send('Backend server is running!'));

// 📌 라우트 연결
app.use('/profile', require('./routes/profile'));
app.use('/main', require('./routes/main'));
app.use('/auth', require('./routes/auth'));
app.use('/studies', require('./routes/study'));
app.use('/schedule', require('./routes/schedule'));
app.use('/notification', require('./routes/notification'));
app.use('/chat', require('./routes/chat'));         // 메시지 관련
app.use('/chatroom', require('./routes/chatroom')); // 채팅방 목록 관련
app.use('/routine', require('./routes/routine'));
app.use('/attendance', require('./routes/attendance'));
app.use('/reviews', require('./routes/review'));
app.use('/comments', require('./routes/comment'));
app.use('/applications', require('./routes/application'));
app.use('/places', require('./routes/place'));
app.use('/favorites', require('./routes/favorite'));
app.use('/reviews/place', require('./routes/placeReview'));

// ✅ 다른 라우트 (외부 프로젝트에서 가져온 부분)
app.use(require('./routes/material'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use(require('./routes/folder'));
app.use('/api/postcomments', require('./routes/postcomment'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

/* ===========================
   ✅ 소켓 이벤트
=========================== */
io.on('connection', (socket) => {
  console.log('🟢 유저 연결됨:', socket.id);

  // 1️⃣ 방 입장
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`➡️ 채팅방 입장: ${roomId}`);
  });

  // 2️⃣ 메시지 전송
  socket.on('sendMessage', async ({ roomId, senderId, type = 'text', content, poll }) => {
    try {
      const message = new Message({
        chatRoomId: roomId,
        sender: senderId,
        type,
        content: type === 'poll' ? null : content,
        poll: type === 'poll' ? poll : null,
        readBy: [senderId],
      });

      await message.save();

      // ✅ lastMessage 미리보기
      let preview = '';
      if (type === 'image') preview = '[이미지]';
      else if (type === 'file') preview = '[파일]';
      else if (type === 'poll') preview = '[투표]';
      else preview = content?.length > 30 ? content.slice(0, 15) + '...' : content;

      // ✅ ChatRoom에 lastMessage(ObjectId) + lastMessagePreview(string) 같이 저장
      await ChatRoom.findByIdAndUpdate(roomId, {
        lastMessage: message._id,
        lastMessagePreview: preview,
        lastMessageAt: new Date(),
      });

      // 메시지 전달
      io.to(roomId).emit('receiveMessage', message);

      // 📌 알림 처리 (간단한 콘솔 출력, 푸시 연동 시 확장)
      const chatRoom = await ChatRoom.findById(roomId);
      for (const userId of chatRoom.members) {
        if (userId.toString() !== senderId) {
          const user = await User.findById(userId);
          const prefs = user.chatNotificationPreferences || {};
          if (prefs.get && prefs.get(roomId.toString()) !== false) {
            console.log(`🔔 알림 전송 대상: ${user.username}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ 메시지 저장 실패:', err.message);
    }
  });

  // 3️⃣ 읽음 처리
  socket.on('readMessage', async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && !message.readBy.map(id => id.toString()).includes(userId)) {
        message.readBy.push(userId);
        await message.save();
        io.to(message.chatRoomId.toString()).emit('updateReadCount', {
          messageId,
          readCount: message.readBy.length,
        });
      }
    } catch (err) {
      console.error('❌ 읽음 처리 실패:', err.message);
    }
  });

  // 4️⃣ 고정 메시지 업데이트
  socket.on('updatePinned', async ({ roomId, messageId }) => {
    try {
      const chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom) return;

      if (chatRoom.pinnedMessage) {
        chatRoom.pinnedHistory.push(chatRoom.pinnedMessage);
      }
      chatRoom.pinnedMessage = messageId;
      await chatRoom.save();

      io.to(roomId).emit('pinnedUpdated', { pinned: messageId });
    } catch (err) {
      console.error('❌ 고정 메시지 실패:', err.message);
    }
  });

  // 5️⃣ 연결 종료
  socket.on('disconnect', () => {
    console.log('🔴 유저 연결 종료:', socket.id);
  });
});

/* ===========================
   ✅ MongoDB 연결 & 서버 실행
=========================== */
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas 연결 성공');
    console.log('📌 현재 연결된 호스트:', mongoose.connection.host);
    console.log('📌 현재 연결된 DB명:', mongoose.connection.name);

    // ✅ 여기서 서버 실행
    server.listen(PORT, () => {
      console.log(`✅ 서버 실행 중`);
      console.log(` → Local:   http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Atlas 연결 실패:', err.message);
  });

