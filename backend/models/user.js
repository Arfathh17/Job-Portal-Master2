const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter', 'admin'],
    default: 'candidate'
  },
  
  // Interview Platform Specific Fields
  profile: {
    phone: String,
    skills: [String],
    experience: String,
    education: String,
    resume: {
      url: String,
      uploadedAt: Date,
      analysis: Object
    },
    // Interview Platform
    preferredRole: {
      type: String,
      enum: ['frontend', 'backend', 'fullstack', 'devops', 'ai-ml', 'hr', 'system-design'],
      default: 'fullstack'
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    bio: String,
    targetCompanies: [String],
    yearsOfExperience: Number,
    linkedInUrl: String
  },

  // Interview History & Analytics
  interviewStats: {
    totalInterviews: { type: Number, default: 0 },
    completedInterviews: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    lastInterviewDate: Date,
    strengthAreas: [String],
    weakAreas: [String],
    progressTrend: [{ date: Date, score: Number }]
  },

  // Learning Path
  learningPath: {
    recommendedTopics: [String],
    completedTopics: [String],
    focusAreas: [String],
    practiceStreak: { type: Number, default: 0 },
    lastPracticeDate: Date
  },

  // Preferences
  preferences: {
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    interviewMode: { type: String, default: 'professional' },
    voiceEnabled: { type: Boolean, default: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' }
  },

  // AI Memory
  aiMemory: {
    frequentlyFailedTopics: [String],
    frequentlyAskedQuestions: [String],
    preferredInterviewStyle: String,
    conversationHistory: { type: mongoose.Schema.Types.Mixed, default: {} }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
