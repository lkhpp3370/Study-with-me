// models/PostComment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // 어떤 게시글에 달린 댓글인지
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 댓글 작성자
  content: { type: String, required: true, trim: true }, // 댓글 내용
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PostComment', commentSchema);