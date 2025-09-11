const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    grade: Number,
    major: String,
    gender: String,
    bio: String,
    isLeave: { type: Boolean, default: false },
    profile_image: String,
    joinedStudies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Study',
      },
    ],
    notifications: {
      push: Boolean,
      chat: Boolean,
      apply: Boolean,
      approve: Boolean,
      schedule: Boolean,
      reminder: Boolean,
      notice: Boolean,
      commentApply: Boolean,
      commentPost: Boolean,
    },
    privacy: {
      gender: Boolean,
      major: Boolean,
      grade: Boolean,
    },
    chatNotificationPreferences: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
