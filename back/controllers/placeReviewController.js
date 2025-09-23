// controllers/placeReviewController.js
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
