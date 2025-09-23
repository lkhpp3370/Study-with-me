const FavoritePlace = require('../models/FavoritePlace');

// 즐겨찾기 토글
exports.toggleFavorite = async (req, res) => {
  try {
    const { userId } = req.body;
    const { placeId } = req.params;

    const existing = await FavoritePlace.findOne({ user: userId, place: placeId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ message: '즐겨찾기 해제됨' });
    }

    const fav = new FavoritePlace({ user: userId, place: placeId });
    await fav.save();
    res.json({ message: '즐겨찾기 추가됨' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
