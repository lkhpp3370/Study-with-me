// models/PlaceRequest.js
const mongoose = require('mongoose');

const PlaceRequestSchema = new mongoose.Schema({
  requestType: { type: String, enum: ['add', 'edit'], required: true }, // ✅ 요청 타입
  targetPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' },   // ✅ 수정 요청 시 대상 장소

  // Place와 동일한 필드
  name: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  type: { type: String, enum: ['cafe', 'study', 'library', 'other'], required: true },
  phone: { type: String },
  website: { type: String },
  openingHours: { type: String },
  open_24h: { type: Boolean, default: false },
  seatCount: { type: Number },
  groupAvailable: { type: Boolean, default: false },
  powerOutlet: { type: Boolean, default: false },
  wifi: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlaceRequest', PlaceRequestSchema);
