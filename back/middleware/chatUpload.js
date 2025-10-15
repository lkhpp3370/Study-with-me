const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📌 채팅 전용 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "uploads", "chat");
    // 업로드 경로 없으면 생성
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    // 필요하면 mimeType 필터링 가능 (예: 이미지, 문서만 허용)
    cb(null, true);
  },
});

module.exports = upload;
