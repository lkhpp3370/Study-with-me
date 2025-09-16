const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    study: { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true, index: true },
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
    recommends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // ✅ 추천한 사람 목록
  },
  { timestamps: true }
);

// 한 스터디에 사용자 1명은 리뷰 1개만 작성 가능
ReviewSchema.index({ study: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
