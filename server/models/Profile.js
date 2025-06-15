import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    phone: String,
    location: String,
    website: String,
    linkedin: String,
    github: String
  },
  summary: String,
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    location: String,
    startDate: Date,
    endDate: Date,
    gpa: String,
    description: String
  }],
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    },
    category: String
  }],
  projects: [{
    name: String,
    description: String,
    technologies: [String],
    url: String,
    github: String,
    startDate: Date,
    endDate: Date
  }],
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    url: String
  }],
  languages: [{
    name: String,
    proficiency: {
      type: String,
      enum: ['Basic', 'Conversational', 'Fluent', 'Native']
    }
  }],
  resume: {
    filename: String,
    originalName: String,
    path: String,
    uploadDate: Date,
    parsedData: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export default mongoose.model('Profile', profileSchema);