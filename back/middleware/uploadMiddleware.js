const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  // 💡 목적지 폴더 설정
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'materials');
    // 💡 폴더가 존재하지 않으면 생성
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  // 💡 파일 이름 설정
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB로 파일 크기 제한
  fileFilter: (req, file, cb) => {
    // 💡 파일 유형 필터링 (선택 사항)
    cb(null, true);
  },
});

module.exports = upload;