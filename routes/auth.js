// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const {
  loginUser,
  requestResetCode,
  resetPassword,
  requestEmailVerification,
  verifyEmailCode,
  checkEmail,  // 이메일 중복 확인 라우터 추가
  checkUsername,
  registerUser
} = require('../controllers/authController');

// 로그인
router.post('/login', loginUser);

// 비밀번호 재설정
router.post('/request-reset', requestResetCode);
router.post('/reset-password', resetPassword);

// 이메일 인증
router.post('/request-email-verification', requestEmailVerification);
router.post('/verify-email-code', verifyEmailCode);

// 이메일 중복 확인
router.post('/check-email', checkEmail);  // 이메일 중복 확인 라우터 추가

// 닉네임 중복 확인
router.post('/check-username', checkUsername);

// 회원가입
router.post('/register', registerUser);

module.exports = router;
