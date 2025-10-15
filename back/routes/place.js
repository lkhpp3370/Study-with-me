// routes/place.js
const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');

// ✅ Kakao API + DB 병합된 장소 목록
router.get('/', placeController.getPlaces);

// ✅ 특정 장소 상세 조회
router.get('/:id', placeController.getPlaceById);

// ✅ 장소 추가 요청
router.post('/request-add', placeController.requestAddPlace);

// ✅ 장소 수정 요청
router.post('/request-edit/:placeId', placeController.requestEditPlace);

module.exports = router;
