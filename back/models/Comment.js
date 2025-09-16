const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    study: { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    isSecret: { type: Boolean, default: false }, // 비밀댓글(작성자/스터디장만 열람)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
