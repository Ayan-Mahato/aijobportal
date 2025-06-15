import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobseeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  atsScore: {
    type: Number,
    min: 0,
    max: 100
  },
  matchDetails: {
    skillsMatch: [{
      skill: String,
      matched: Boolean,
      score: Number
    }],
    experienceMatch: {
      required: Number,
      candidate: Number,
      score: Number
    },
    educationMatch: {
      score: Number,
      details: String
    },
    overallMatch: String
  },
  coverLetter: String,
  notes: String
}, {
  timestamps: true
});

// Ensure unique applications
applicationSchema.index({ job: 1, jobseeker: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);