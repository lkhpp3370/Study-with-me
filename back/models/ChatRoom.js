const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatRoomSchema = new Schema({
  studyId: { type: Schema.Types.ObjectId, ref: 'Study', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  noticeMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
