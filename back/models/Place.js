// models/Place.js
const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },             // 📌 장소 이름
  address: { type: String, required: true, trim: true },          // 📌 주소
  latitude: { type: Number, required: true },                     // 지도 위도
  longitude: { type: Number, required: true },                    // 지도 경도
  type: {                                                         // 📌 장소 타입
    type: String,
    enum: ['cafe', 'study', 'library', 'other'],
    default: 'other',
  },
  phone: { type: String },                                        // 전화번호
  website: { type: String },                                      // 웹사이트

  // 👉 운영 관련
  openingHours: { type: String, default: '' },                    // 🕒 이용 시간 (예: "09:00~22:00")
  open_24h: { type: Boolean, default: false },                    // 🕒 24시간 여부
  noise: { type: Number, min: 1, max: 5, default: 3 },            // 🔊 소음도 (1~5)

  // 👉 좌석/공간 관련
  seatCount: { type: Number, default: 0 },                        // 🪑 좌석 수
  spaceSize: { type: String, enum: ['넓음', '보통', '좁음'], default: '보통' }, // 공간 크기
  quietLevel: { type: String, enum: ['조용함', '보통', '시끄러움'], default: '보통' }, // 🤫 조용함 정도

  // 👉 편의 시설 관련
  groupAvailable: { type: Boolean, default: false },              // 👥 그룹 이용 가능 여부
  powerOutlet: { type: Boolean, default: false },                 // 🔌 콘센트 유무
  wifi: { type: Boolean, default: false },                        // 📶 와이파이 유무
  price: { type: String, enum: ['무료', '저렴', '보통', '비쌈'], default: '보통' }, // 💸 가격대

  // 사용자 제안 데이터 여부
  pending: { type: Boolean, default: false },                     // ✍️ 제안/수정 요청인지 여부
}, { timestamps: true });

module.exports = mongoose.model('Place', placeSchema);
