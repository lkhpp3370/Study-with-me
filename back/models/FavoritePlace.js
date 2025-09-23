const mongoose = require('mongoose');

const favoritePlaceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
}, { timestamps: true });

favoritePlaceSchema.index({ user: 1, place: 1 }, { unique: true });

module.exports = mongoose.model('FavoritePlace', favoritePlaceSchema);
