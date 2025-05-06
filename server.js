const express = require('express');               // Express 웹 프레임워크를 불러온다
const mongoose = require('mongoose');             // MongoDB ODM인 Mongoose를 불러온다
const dotenv = require('dotenv');                 // 환경변수 파일(.env)을 읽기 위한 라이브러리
const cors = require('cors');                     // 다른 출처의 요청을 허용하기 위한 CORS 미들웨어 불러오기

dotenv.config();                                  // .env 파일의 내용을 process.env에 적용한다

const app = express();                            // Express 애플리케이션 인스턴스를 생성한다

app.use(cors());                                  // 모든 출처의 요청을 허용하도록 설정 (CORS 보안 우회 목적)
app.use(express.json());                          // 요청의 body에 있는 JSON 데이터를 해석할 수 있게 설정

const profileRoutes = require('./routes/profile'); // 프로필 관련 라우터를 불러온다
app.use('/profile', profileRoutes);               // '/profile'로 시작하는 요청은 profileRoutes에서 처리한다

const PORT = process.env.PORT || 3000;            // 환경변수에 PORT가 있으면 그 값을 사용, 없으면 3000번 포트를 사용
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studywithme'; // MongoDB 연결 URI를 환경변수 또는 기본값으로 설정

mongoose.connect(MONGO_URI)                       // MongoDB에 연결을 시도한다
  .then(() => {                                   // 연결이 성공했을 경우
    console.log('✅ MongoDB 연결 성공');           // 성공 메시지를 출력
    app.listen(PORT, () => {                      // Express 서버를 지정한 포트에서 실행한다
      console.log(`✅ 서버 실행 중: http://localhost:${PORT}`); // 서버 주소 출력
    });
  })
  .catch((err) => {                               // MongoDB 연결이 실패한 경우
    console.error('❌ MongoDB 연결 실패:', err.message); // 에러 메시지를 출력
  });