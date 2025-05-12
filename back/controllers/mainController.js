const User = require('../models/User');   // User 모델
const Study = require('../models/Study'); // Study 모델

// 가입 중인 스터디 목록 조회
exports.getJoinedStudies = async (req, res) => {
  try {
    const userId = req.params.userId; // 요청 URL에서 userId 추출

    // User 모델에서 joinedStudies 필드를 populate(연결된 Study 문서로 치환)
    const user = await User.findById(userId).populate('joinedStudies');

    // 사용자가 존재하지 않으면 404 응답
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    // 가입 스터디 배열이 비어있으면 빈 배열 반환
    res.json({
      username: user.username,              // 사용자 이름
      studies: user.joinedStudies || []     // 가입 스터디 배열
    });
  } catch (err) {
    // 예외 발생 시 500 서버 오류 반환
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};
