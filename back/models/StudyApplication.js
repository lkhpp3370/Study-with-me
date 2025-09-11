const mongoose = require('mongoose');

const StudyApplicationSchema = new mongoose.Schema(
  {
    study:     { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    message:   { type: String, default: '' },
    status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

// 중복 신청 방지
StudyApplicationSchema.index({ study: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('StudyApplication', StudyApplicationSchema);
