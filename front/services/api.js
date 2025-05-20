//services/api.js
// ✅ 백엔드 API 요청을 위한 axios 인스턴스

import axios from 'axios';
import { BACKEND_URL } from '@env';   // ➡️ .env의 IP 주소 불러오기

// ✅ axios 인스턴스 생성
const api = axios.create({
  baseURL: BACKEND_URL,  // ➡️ http://192.168.xxx.xxx:3000
  timeout: 5000,         // ➡️ 요청 타임아웃 (ms)
});

// ✅ export 해서 전역에서 사용
export default api;