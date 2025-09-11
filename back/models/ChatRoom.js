const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    studyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: Date,
    noticeMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
