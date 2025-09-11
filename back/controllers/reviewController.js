const Review = require('../models/Review');
const Study  = require('../models/Study');

// GET /reviews/:studyId  -> 평균 + 리뷰 목록 + 내 리뷰(optional)
exports.getStudyReviews = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { userId } = req.query; // 선택적

    const [list, agg] = await Promise.all([
      Review.find({ study: studyId })
        .populate('user', 'username')
        .sort({ createdAt: -1 }),
      Review.aggregate([
        { $match: { study: new (require('mongoose').Types.ObjectId)(studyId) } },
        { $group: { _id: '$study', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
      ])
    ]);

    const avg = agg.length ? Number(agg[0].avg.toFixed(2)) : 0;
    const cnt = agg.length ? agg[0].cnt : 0;

    const myReview = userId
      ? await Review.findOne({ study: studyId, user: userId })
      : null;

    res.json({ average: avg, count: cnt, reviews: list, myReview });
  } catch (err) {
    console.error('❌ 리뷰 조회 실패:', err);
    res.status(500).json({ message: '리뷰 조회 실패', error: err.message });
  }
};

// POST /reviews/:studyId  -> upsert(있으면 수정, 없으면 생성)
exports.upsertReview = async (req, res) => {
  try {
    const { studyId } = req.params;
    const { userId, rating, comment } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ message: 'userId와 rating은 필수입니다.' });
    }

    const study = await Study.findById(studyId);
    if (!study) return res.status(404).json({ message: '스터디가 존재하지 않습니다.' });

    // (선택) 스터디 멤버만 리뷰 가능
    const isMember = study.members.map(String).includes(String(userId)) || String(study.host) === String(userId);
    if (!isMember) return res.status(403).json({ message: '스터디 멤버만 리뷰를 작성할 수 있습니다.' });

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

// DELETE /reviews/:reviewId  -> 작성자만 삭제
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
