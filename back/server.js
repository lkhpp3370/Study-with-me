const express = require('express');                   // Express 웹 프레임워크를 불러온다
const mongoose = require('mongoose');                 // MongoDB ODM인 Mongoose를 불러온다
const dotenv = require('dotenv');                     // 환경변수 파일(.env)을 읽기 위한 라이브러리
const cors = require('cors');                         // CORS 미들웨어를 불러온다
const ip = require('ip');                             // 자신의 로컬 IP를 가져오는 모듈

dotenv.config();                                      // .env 파일의 내용을 process.env에 적용한다

const app = express();                                // Express 애플리케이션 인스턴스를 생성한다

app.use(cors());                                      // 모든 출처의 요청을 허용하도록 설정 (CORS 보안 우회)
app.use(express.json());                              // 요청 body의 JSON 데이터를 해석하도록 설정
app.use(express.urlencoded({ extended: true }));

// ✅ 루트 테스트용 엔드포인트 (접속 확인용)
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// ✅ 라우터 연결
const profileRoutes = require('./routes/profile');   // 프로필 관련 라우터 불러오기
app.use('/profile', profileRoutes);                  // '/profile'로 시작하는 요청은 profileRoutes에서 처리
const mainRoutes = require('./routes/main');         // 메인페이지 라우터 불러오기
app.use('/main', mainRoutes);                        // /main 경로로 라우터 등록
const authRoutes = require('./routes/auth');         // auth 라우터 불러오기
app.use('/auth', authRoutes);                        // /auth 경로로 요청 전달
const studyRoutes = require('./routes/study');       // study 라우터 불러오기
app.use('/studies', studyRoutes);                    // /study 경로로 요청 전달

// ✅ 환경 변수 및 기본 설정
const PORT = process.env.PORT || 3000;               // 환경변수 PORT 또는 기본값 3000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://192.168.XX.XXX:27017/studywithme'; // MongoDB 연결 URI

// ✅ MongoDB 연결
mongoose.connect(MONGO_URI)
  .then(() => {                                     // 연결 성공 시
    console.log('✅ MongoDB 연결 성공');

    // ✅ 서버 실행 → 모든 IP에서 접속 허용 (0.0.0.0)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ 서버 실행 중:`);
      console.log(` → Local:   http://localhost:${PORT}`);           // localhost 테스트용
      console.log(` → Network: http://${ip.address()}:${PORT}`);     // 다른 기기(폰/에뮬레이터)에서 접속용
    });
  })
  .catch((err) => {                                  // MongoDB 연결 실패 시
    console.error('❌ MongoDB 연결 실패:', err.message);
  });
