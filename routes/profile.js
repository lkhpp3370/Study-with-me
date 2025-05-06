const express = require('express'); // Express 프레임워크를 불러옵니다.
const router = express.Router(); // Express의 라우터 기능을 사용하기 위해 Router 인스턴스를 생성합니다.

// 프로필 관련 컨트롤러 함수들을 불러옵니다.
const {
  getProfile,                 // 사용자 프로필 조회 함수
  updateProfile,              // 사용자 정보 수정 함수
  updatePrivacy,              // 프로필 공개 범위 수정 함수
  updateNotificationSettings, // 알림 설정 수정 함수
  deleteUser                  // 계정 삭제(탈퇴) 함수
} = require('../controllers/profileController');

// GET 요청: 사용자 ID에 해당하는 프로필 정보를 조회합니다.
router.get('/:id', getProfile);

// PUT 요청: 사용자 ID에 해당하는 프로필 정보를 수정합니다.
router.put('/:id', updateProfile);

// PATCH 요청: 사용자 프로필 공개 여부를 설정합니다.
router.patch('/:id/privacy', updatePrivacy);

// PATCH 요청: 사용자 알림 설정을 수정합니다.
router.patch('/:id/notifications', updateNotificationSettings);

// DELETE 요청: 사용자 계정을 삭제(탈퇴)합니다.
router.delete('/:id', deleteUser);

// 위에서 정의한 라우터들을 외부에서 사용할 수 있도록 내보냅니다.
module.exports = router;
