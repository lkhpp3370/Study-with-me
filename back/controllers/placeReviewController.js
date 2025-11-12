// controllers/placeReviewController.js
const mongoose = require('mongoose'); // 맨 위에 추가
const PlaceReview = require('../models/PlaceReview');

// ✅ 특정 장소 리뷰 조회
exports.getReviewsByPlace = async (req, res) => {
  try {
    const reviews = await PlaceReview.find({ place: req.params.placeId })
      .populate('user', 'username') // 작성자 닉네임만
      .sort({ createdAt: -1 }); // 최신순
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 리뷰 작성
exports.addReview = async (req, res) => {
  try {
    const { rating, comment, userId } = req.body;

    // 중복 체크
    const existing = await PlaceReview.findOne({ place: req.params.placeId, user: userId });
    if (existing) {
      return res.status(400).json({ message: '이미 이 장소에 리뷰를 작성했습니다.' });
    }

    const review = new PlaceReview({
      place: req.params.placeId,
      user: userId,
      rating,
      comment,
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// ✅ 리뷰 수정
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await PlaceReview.findByIdAndUpdate(
      req.params.reviewId,
      { rating, comment },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: '리뷰를 찾을 수 없습니다' });
    res.json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ 리뷰 삭제
exports.deleteReview = async (req, res) => {
  try {
    const review = await PlaceReview.findByIdAndDelete(req.params.reviewId);
    if (!review) return res.status(404).json({ message: '리뷰를 찾을 수 없습니다' });
    res.json({ message: '리뷰 삭제 완료' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 특정 장소 평균 평점/개수
exports.getAvgByPlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const agg = await PlaceReview.aggregate([
      { $match: { place: new mongoose.Types.ObjectId(placeId) } },
      { $group: { _id: '$place', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const doc = agg[0] || { avg: 0, count: 0 };
    res.json({ avg: Math.round(doc.avg * 10) / 10, count: doc.count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};