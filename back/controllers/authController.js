// backend/controllers/authController.js
const User = require('../models/User');

let emailVerificationCodes = {}; // 이메일 인증 코드 저장용 (메모리)

// ✅ 이메일 중복 확인 (회원가입 전)
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    res.json({ message: '사용 가능한 이메일입니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// 로그인
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    res.json({ message: '로그인 성공', username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// 비밀번호 재설정 코드 요청
exports.requestResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '가입된 이메일이 없습니다.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    await user.save();
    console.log(`[이메일 인증] 이메일: ${email}, 코드: ${code}`);
    res.json({ message: '인증 코드가 발송되었습니다. (테스트용)' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// ✅ 비밀번호 재설정 코드 확인 (새로 추가)
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user || String(user.resetCode).trim() !== String(code).trim()) {
      return res.status(400).json({ message: '인증 코드가 올바르지 않습니다.' });
    }

    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// 비밀번호 재설정
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.resetCode !== code) {
      return res.status(400).json({ message: '인증 코드가 올바르지 않습니다.' });
    }
    user.password = newPassword;
    user.resetCode = null;
    await user.save();
    res.json({ message: '비밀번호 변경 성공' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// ✅ 이메일 인증 코드 요청
exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // 이메일 형식 체크
    if (!email.endsWith('@pukyong.ac.kr')) {
      return res.status(400).json({ message: '부경대학교 이메일만 사용 가능합니다.' });
    }

    // ✅ 이메일 중복 체크
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    emailVerificationCodes[email] = code; // 코드 저장
    console.log(`[이메일 인증] 이메일: ${email}, 코드: ${code}`);
    res.json({ message: '학교 이메일로 인증 코드가 발송되었습니다. (테스트)', code });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// ✅ 이메일 인증 코드 확인
exports.verifyEmailCode = async (req, res) => {
  console.log('[verifyEmailCode 요청]', req.body);
  try {
    const { email, code } = req.body;
    const validCode = emailVerificationCodes[email];
    if (validCode && validCode === code) {
      delete emailVerificationCodes[email]; // 확인 후 삭제
      return res.json({ verified: true });
    }
    res.json({ verified: false });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// ✅ 닉네임 중복 확인
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (username.length < 2 || username.length > 12) {
      return res.status(400).json({ message: '닉네임은 2~12자 사이여야 합니다.' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
    }
    res.json({ message: '사용 가능한 닉네임입니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// ✅ 회원가입
exports.registerUser = async (req, res) => {
  try {
    const { email, password, username, gender, major, grade, isLeave, privacy } = req.body;

    // 이메일 형식 체크
    if (!email.endsWith('@pukyong.ac.kr')) {
      return res.status(400).json({ message: '부경대학교 이메일만 사용 가능합니다.' });
    }

    // 닉네임 길이 체크
    if (username.length < 2 || username.length > 12) {
      return res.status(400).json({ message: '닉네임은 2~12자 사이여야 합니다.' });
    }

    // 이메일 중복 체크
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    const newUser = new User({
      email,
      password,
      username,
      gender,
      major,
      grade,
      isLeave,
      privacy: privacy || {},
      joinedStudies: []
    });

    await newUser.save();
    res.json({ message: '회원가입 성공' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};
