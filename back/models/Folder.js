const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // 'owner' 필드는 이 폴더를 생성한 사용자(개인 폴더의 경우)를 참조합니다.
  // 모든 폴더가 특정 사용자에 의해 생성된다고 가정할 경우 required: true
  // 스터디 폴더의 경우 owner가 없을 수도 있으므로 required: false로 설정합니다.
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  // 'study' 필드는 이 폴더가 특정 스터디에 속하는 경우 해당 스터디를 참조합니다.
  // 이 필드가 존재하면 '스터디 폴더', 존재하지 않으면 '개인 폴더' 등으로 활용할 수 있습니다.
  study: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study', // 기존 Study 모델을 참조합니다.
    required: false,
    unique: false,
  },
  description: {
    type: String,
    required: false,
    default: '',
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Folder', folderSchema);
