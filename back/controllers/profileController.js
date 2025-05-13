// backend/controllers/profileController.js
const User = require('../models/User');

// [1] 사용자 프로필 조회
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// [2] 사용자 프로필 수정 (privacy 포함)
exports.updateProfile = async (req, res) => {
  try {
    const { bio, grade, major, gender, profile_image, isLeave, username, privacy } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { bio, grade, major, gender, profile_image, isLeave, username, privacy },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({ message: '프로필이 수정되었습니다.', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// [3] 공개 범위 설정
exports.updatePrivacy = async (req, res) => {
  try {
    const { privacy } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { privacy },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({ message: '공개 범위가 변경되었습니다.', privacy: updatedUser.privacy });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// [4] 알림 설정
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { notifications } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { notifications },
      { new: true }
    );
    res.json({ message: '알림 설정이 저장되었습니다.', notifications: updatedUser.notifications });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// [5] 계정 삭제
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({ message: '계정이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};
