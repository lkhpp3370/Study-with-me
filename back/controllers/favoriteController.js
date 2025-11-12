// controllers/favoriteController.js
const Favorite = require('../models/Favorite');

// ✅ 즐겨찾기 조회
exports.getFavorites = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json([]);

    // place 정보까지 같이 반환
    const list = await Favorite.find({ user: userId }).populate('place');
    res.json(list);
  } catch (err) {
    console.error('❌ getFavorites 오류:', err);
    res.status(500).json([]);
  }
};

// ✅ 즐겨찾기 토글
exports.toggleFavorite = async (req, res) => {
  try {
    const { userId, placeId } = req.body;
    if (!userId || !placeId) {
      return res.status(400).json({ message: 'userId, placeId 필요' });
    }

    let fav = await Favorite.findOne({ user: userId, place: placeId });
    if (fav) {
      // 이미 있으면 삭제
      await fav.deleteOne();
      return res.json({ isFavorite: false });
    } else {
      // 없으면 추가
      fav = new Favorite({ user: userId, place: placeId });
      await fav.save();
      return res.json({ isFavorite: true });
    }
  } catch (err) {
    console.error('❌ toggleFavorite 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};
