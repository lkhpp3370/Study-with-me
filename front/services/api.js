// services/api.js
import axios from 'axios';
import Constants from 'expo-constants';

const getExtra = () =>
  (Constants?.expoConfig?.extra) ||
  (Constants?.manifest?.extra) || // 일부 런타임 호환
  {};

const BACKEND_URL =
  getExtra().BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL || // 선택적 fallback
  '';

const KAKAO_JS_KEY =
  getExtra().KAKAO_JS_KEY ||
  process.env.EXPO_PUBLIC_KAKAO_JS_KEY || // 선택적 fallback
  '';

const BASE_URL = (BACKEND_URL || '').replace(/\/+$/, ''); // 끝 슬래시 제거
const normPath = (p) =>
  encodeURI(String(p || '').replace(/^\/+/, '').replace(/\\/g, '/'));

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 7000,
  headers: { 'Content-Type': 'application/json' },
});

export { BACKEND_URL, BASE_URL, KAKAO_JS_KEY, normPath };
export default api;
