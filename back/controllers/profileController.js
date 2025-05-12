const User = require('../models/User'); // 사용자(User) 모델을 불러옵니다.

// [1] 사용자 프로필 조회 기능
exports.getProfile = async (req, res) => {
  try {
    // 사용자의 ID(req.params.id)로 사용자 정보를 찾고 비밀번호 필드는 제외합니다.
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      // 사용자가 존재하지 않으면 404 오류를 반환합니다.
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    // 사용자 정보를 JSON 형태로 응답합니다.
    res.json(user);
  } catch (err) {
    // 서버 에러 발생 시 500 오류와 메시지를 반환합니다.
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// [2] 사용자 프로필 수정 기능 (프로필 관리 페이지)
exports.updateProfile = async (req, res) => {
  try {
    // 클라이언트 요청에서 수정할 사용자 정보 필드들을 추출합니다.
    const { bio, grade, major, gender, profile_image, isLeave, username } = req.body;

    // 사용자 ID로 찾은 후 해당 필드들을 수정하고, 수정된 객체를 반환합니다.
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, // 대상 사용자 ID
      { bio, grade, major, gender, profile_image, isLeave, username }, // 수정할 정보
      { new: true } // 수정된 정보를 응답으로 받기 위한 옵션
    );

    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 수정 완료 메시지와 수정된 사용자 정보를 응답합니다.
    res.json({ message: '프로필이 수정되었습니다.', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// [3] 프로필 공개 범위 설정 기능
exports.updatePrivacy = async (req, res) => {
  try {
    const { privacy } = req.body; // 공개 여부 값을 요청 바디에서 받습니다.

    // 사용자 ID에 해당하는 사용자의 privacy 필드를 수정합니다.
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { privacy },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '공개 범위가 변경되었습니다.', privacy: updatedUser.privacy });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

// [4] 알림 설정 수정 기능
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { notifications } = req.body; // 알림 설정 값들을 객체로 받습니다.

    // 사용자 ID로 해당 사용자를 찾아 알림 설정 필드를 갱신합니다.
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

// [5] 계정 삭제 기능 (회원 탈퇴)
exports.deleteUser = async (req, res) => {
  try {
    // 사용자 ID로 계정을 삭제합니다.
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '계정이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};
