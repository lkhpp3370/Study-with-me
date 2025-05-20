const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  grade: { type: Number, required: true },
  major: { type: String, required: true },
  gender: { type: String, required: true },
  profile_image: String,
  bio: String,
  isLeave: Boolean,
  privacy: {
    gender: { type: Boolean, default: true },
    major: { type: Boolean, default: true },
    grade: { type: Boolean, default: true }
  },
  joinedStudies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study'
  }],
  notifications: {
    push: { type: Boolean, default: true },
    chat: { type: Boolean, default: true },
    apply: { type: Boolean, default: true },
    approve: { type: Boolean, default: true },
    schedule: { type: Boolean, default: true },
    reminder: { type: Boolean, default: true },
    notice: { type: Boolean, default: true },
    commentApply: { type: Boolean, default: true },
    commentPost: { type: Boolean, default: true }
  },
  chatNotificationPreferences: {
    type: Map,
    of: Boolean,
    default: {}
  },
  resetCode: String
});

module.exports = mongoose.model('User', UserSchema);