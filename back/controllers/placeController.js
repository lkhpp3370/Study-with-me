// controllers/placeController.js
const Place = require('../models/Place');
const PlaceRequest = require('../models/PlaceRequest');
const axios = require('axios');

const KAKAO_REST_KEY = process.env.KAKAO_REST_KEY;

// ✅ 부경대 좌표 (대연캠퍼스 인근)
const DEFAULT_X = 129.105;
const DEFAULT_Y = 35.1335;
const DEFAULT_RADIUS = 2000;

// ✅ Kakao API 호출 함수 (type 태그 포함)
async function fetchFromKakao(query, type) {
  try {
    const res = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
      params: { query, x: DEFAULT_X, y: DEFAULT_Y, radius: DEFAULT_RADIUS },
      headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
    });
    // 각 문서에 __type 필드 붙이기
    return res.data.documents.map(p => ({ ...p, __type: type }));
  } catch (err) {
    console.error('Kakao API 요청 실패:', err.message);
    return [];
  }
}

// ✅ Kakao 데이터 → Place 모델 매핑 & DB 저장/갱신
async function upsertPlaceFromKakao(p) {
  const name = p.place_name;
  const address = p.road_address_name || p.address_name;

  // ✅ name + address 조합으로 중복 확인
  let place = await Place.findOne({ name, address });

  if (!place) {
    place = new Place({
      kakaoId: p.id, // 참고용으로는 저장해둠
      name,
      address,
      latitude: parseFloat(p.y),
      longitude: parseFloat(p.x),
      type: p.__type,   // ✅ API 호출 시 지정한 type 저장
      phone: p.phone || '',
      website: p.place_url || '',
      open_24h: false,
      groupAvailable: false,
      wifi: false,
      powerOutlet: false,
    });
    await place.save();
  }
  return place;
}

/** ✅ 장소 목록 불러오기 (DB + Kakao 병합) */
exports.getPlaces = async (req, res) => {
  try {
    // Kakao API 호출 (카페 + 스터디카페 + 도서관)
    const [cafes, studyCafes, libraries] = await Promise.all([
      fetchFromKakao('카페', 'cafe'),
      fetchFromKakao('스터디카페', 'study'),
      fetchFromKakao('도서관', 'library'),
    ]);

    const kakaoPlaces = [...cafes, ...studyCafes, ...libraries];

    // Kakao 데이터 DB에 업서트
    const results = await Promise.all(kakaoPlaces.map(upsertPlaceFromKakao));

    res.json(results);
  } catch (err) {
    console.error('장소 불러오기 실패:', err.message);
    res.status(500).json({ message: '장소 불러오기 실패' });
  }
};

/** ✅ 특정 장소 상세보기 */
exports.getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: '장소를 찾을 수 없습니다.' });
    res.json(place);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** ✅ 장소 추가 요청 */
exports.requestAddPlace = async (req, res) => {
  try {
    const request = new PlaceRequest({
      ...req.body,
      requestType: 'add',
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** ✅ 장소 수정 요청 */
exports.requestEditPlace = async (req, res) => {
  try {
    const request = new PlaceRequest({
      ...req.body,
      requestType: 'edit',
      targetPlace: req.params.placeId,
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
