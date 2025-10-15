const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },              // 장소 이름
  address: { type: String, required: true },           // 주소
  latitude: { type: Number, required: true },          // 위도
  longitude: { type: Number, required: true },         // 경도
  type: { type: String, enum: ['cafe', 'study', 'library', 'other'], required: true }, // 장소 유형

  phone: { type: String },                             // 전화번호
  website: { type: String },                           // 웹사이트

  openingHours: { type: String },                      // 운영 시간
  open_24h: { type: Boolean, default: false },         // 24시간 여부

  seatCount: { type: Number },                         // 좌석 수
  groupAvailable: { type: Boolean, default: false },   // 그룹 이용 가능 여부
  wifi: { type: Boolean, default: false },             // 와이파이 여부
  powerOutlet: { type: Boolean, default: false },      // 콘센트 여부
}, { timestamps: true });

module.exports = mongoose.model('Place', placeSchema);
