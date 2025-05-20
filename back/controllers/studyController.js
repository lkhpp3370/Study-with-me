// controllers/studyController.js
const Study = require('../models/Study');

// ✅ 스터디 ID로 스터디 정보 조회
exports.getStudyById = async (req, res) => {
  try {
    const study = await Study.findById(req.params.studyId);
    if (!study) {
      return res.status(404).json({ message: '스터디를 찾을 수 없습니다.' });
    }
    res.json(study);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};
