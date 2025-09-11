const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },     // 자료의 제목
  filename: { type: String, required: true },  // 실제 저장된 파일명 (서버 내부용)
  filepath: { type: String, required: true },  // 서버 내 파일 경로
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 자료를 업로드한 사용자
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder', // 새로 정의한 Folder 모델을 참조합니다.
    default: null, // 폴더가 지정되지 않은 자료도 있을 수 있습니다 (예: '기타' 폴더)
  },
  createdAt: { type: Date, default: Date.now } // 자료 생성일
});

module.exports = mongoose.model('Material', materialSchema);
