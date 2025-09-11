const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  study: { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String, 
    enum: ['NOTICE', 'QNA', 'FREE'], 
    required: true 
  },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 업데이트 시 updatedAt 자동 갱신
postSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Post', postSchema);