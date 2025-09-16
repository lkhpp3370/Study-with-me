const Review = require('../models/Review');
const Study  = require('../models/Study');

// GET /reviews/:studyId
// GET /reviews/:studyId
exports.getStudyReviews = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { userId } = req.query;
    const mongoose = require('mongoose');

    // 리뷰 목록 (추천 수 기준 내림차순, 추천 수가 같으면 최신순)
    const list = await Review.aggregate([
      { $match: { study: new mongoose.Types.ObjectId(studyId) } },
      {
        $addFields: {
          recommendsCount: { $size: { $ifNull: ["$recommends", []] } }
        }
      },
      { $sort: { recommendsCount: -1, createdAt: -1 } },
    ]);

    // 사용자 정보 populate
    const populated = await Review.populate(list, { path: "user", select: "username" });

    // 평균 평점, 개수
    const agg = await Review.aggregate([
      { $match: { study: new mongoose.Types.ObjectId(studyId) } },
      { $group: { _id: "$study", avg: { $avg: "$rating" }, cnt: { $sum: 1 } } }
    ]);

    const avg = agg.length ? Number(agg[0].avg.toFixed(2)) : 0;
    const cnt = agg.length ? agg[0].cnt : 0;

    // 내 리뷰
    const myReview = userId
      ? await Review.findOne({ study: studyId, user: userId })
      : null;

    res.json({ average: avg, count: cnt, reviews: populated, myReview });
  } catch (err) {
    console.error("❌ 리뷰 조회 실패:", err);
    res.status(500).json({ message: "리뷰 조회 실패", error: err.message });
  }
};


// POST /reviews/:studyId
exports.upsertReview = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { userId, rating, comment } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ message: 'userId와 rating은 필수입니다.' });
    }

    const study = await Study.findById(studyId);
    if (!study) return res.status(404).json({ message: '스터디가 존재하지 않습니다.' });

    const isMember = study.members.map(String).includes(String(userId)) || String(study.host) === String(userId);
    if (!isMember) {
      return res.status(403).json({
        code: 'NOT_MEMBER',
        message: '가입하지 않은 스터디입니다. 리뷰 작성은 멤버만 가능합니다.'
      });
    }

    const doc = await Review.findOneAndUpdate(
      { study: studyId, user: userId },
      { $set: { rating, comment: comment || '' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: '리뷰 저장 완료', review: doc });
  } catch (err) {
    console.error('❌ 리뷰 저장 실패:', err);
    res.status(500).json({ message: '리뷰 저장 실패', error: err.message });
  }
};

// DELETE /reviews/:reviewId
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: '리뷰가 없습니다.' });
    if (String(review.user) !== String(userId)) {
      return res.status(403).json({ message: '본인 리뷰만 삭제할 수 있습니다.' });
    }

    await review.deleteOne();
    res.json({ message: '리뷰 삭제 완료' });
  } catch (err) {
    console.error('❌ 리뷰 삭제 실패:', err);
    res.status(500).json({ message: '리뷰 삭제 실패', error: err.message });
  }
};

// ✅ 리뷰 추천 (toggle)
exports.toggleRecommend = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: '리뷰가 없습니다.' });

    const idx = review.recommends.findIndex(uid => String(uid) === String(userId));
    if (idx >= 0) {
      review.recommends.splice(idx, 1); // 추천 취소
    } else {
      review.recommends.push(userId); // 추천 추가
    }

    await review.save();
    res.json({ message: '추천 상태 변경 완료', recommends: review.recommends.length });
  } catch (err) {
    console.error('❌ 리뷰 추천 실패:', err);
    res.status(500).json({ message: '리뷰 추천 실패', error: err.message });
  }
};
