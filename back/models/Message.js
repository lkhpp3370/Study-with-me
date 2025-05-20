const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  chatRoomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image', 'vote', 'notice'], default: 'text' },
  content: { type: String, required: true },
  voteOptions: [String],
  voteResult: { type: Map, of: Number },
  voteDeadline: Date,
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
