// ✅ models/Message.js - 투표 필드 포함 최종본
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
      enum: ['text', 'image', 'notice', 'poll'],
      default: 'text',
    },
    content: {
      type: String,
      required: true,
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
