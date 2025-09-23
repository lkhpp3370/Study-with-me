const Place = require('../models/Place');

// 모든 장소 조회
exports.getPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places); // ✅ 배열로 내려주기
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 장소 추가 요청
exports.addPlace = async (req, res) => {
  try {
    const place = new Place({
      ...req.body,
      pending: true,
      type: req.body.type || 'other',
      open_24h: req.body.open_24h || false,
      noise: req.body.noise || 3,
    });
    await place.save();
    res.status(201).json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        pending: true,
        type: req.body.type || 'other',
        open_24h: req.body.open_24h ?? false,
        noise: req.body.noise ?? 3,
      },
      { new: true }
    );
    if (!place) return res.status(404).json({ message: '장소를 찾을 수 없습니다' });
    res.json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 장소 정보 수정 요청
exports.updatePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      { ...req.body, type: req.body.type || 'etc', pending: true },
      { new: true }
    );
    if (!place) return res.status(404).json({ message: '장소를 찾을 수 없습니다' });
    res.json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
