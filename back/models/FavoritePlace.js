// models/Favorite.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
}, { timestamps: true });

// 같은 user가 같은 place를 중복 추가 못하도록 unique 설정
favoriteSchema.index({ user: 1, place: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
