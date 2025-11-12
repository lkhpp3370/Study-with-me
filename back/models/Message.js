// models/Message.js
const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: String,
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const messageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'poll'], // ✅ notice 제거
      default: 'text',
    },
    content: {
      type: String,
      required: function () {
        // 텍스트, 이미지일 때만 content 필요
        return this.type === 'text' || this.type === 'image';
      },
    },
    poll: {
      question: String,
      options: [pollOptionSchema],
      deadline: Date,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ✅ 고정 시간 기록용 (optional)
    pinnedAt: Date,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
