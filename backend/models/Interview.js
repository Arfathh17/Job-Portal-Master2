const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Interview Session Details
  sessionId: {
    type: String,
    unique: true,
    required: true
  },

  interviewType: {
    type: String,
    enum: ['behavioral', 'technical', 'coding', 'system-design', 'hr', 'mixed', 'ai-ml', 'full-stack', 'faang'],
    default: 'technical'
  },

  role: {
    type: String,
    required: true
  },

  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },

  companyMode: {
    type: String,
    enum: ['google', 'amazon', 'microsoft', 'meta', 'apple', 'netflix', 'startup', 'generic'],
    default: 'generic'
  },

  mode: {
    type: String,
    enum: ['text', 'voice', 'video'],
    default: 'text'
  },

  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'abandoned'],
    default: 'not-started'
  },

  // Interview Content
  afaiSessionId: String,
  setup: mongoose.Schema.Types.Mixed,
  conversation: [{
    role: String,
    content: String,
    at: {
      type: Date,
      default: Date.now
    }
  }],
  afaiSummary: mongoose.Schema.Types.Mixed,

  // Interview Content
  questions: [{
    questionId: mongoose.Schema.Types.ObjectId,
    question: String,
    category: String,
    difficulty: String,
    askedAt: Date,
    answer: String,
    aiEvaluation: {
      accuracy: Number,
      confidence: Number,
      technicalDepth: Number,
      communicationQuality: Number,
      clarity: Number,
      followUp: String,
      strengths: [String],
      improvements: [String]
    },
    timeTaken: Number // in seconds
  }],

  // Coding Round (if applicable)
  codingRound: {
    problemTitle: String,
    problemDescription: String,
    constraints: String,
    examples: [String],
    code: String,
    language: String,
    testsPassed: Number,
    totalTests: Number,
    timeComplexity: String,
    spaceComplexity: String,
    codeQuality: Number,
    completionTime: Number, // in seconds
    verdict: String
  },

  // Performance Metrics
  performance: {
    overallScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    problemSolvingScore: { type: Number, default: 0 },
    averageConfidence: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    interviewReadiness: { type: Number, default: 0 }
  },

  // Interview Metadata
  duration: Number, // in seconds
  totalQuestions: Number,
  correctAnswers: Number,
  partialAnswers: Number,
  incorrectAnswers: Number,
  hintsTaken: Number,

  // Resume-based questions flag
  resumeAnalyzed: Boolean,
  resumeSkillsMatched: [String],

  // Feedback
  feedback: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    topicsToFocus: [String],
    improvementAreas: [String],
    detailedAnalysis: String,
    nextSteps: [String]
  },

  // Transcription (for voice mode)
  transcription: [{
    speaker: String, // 'user' or 'ai'
    text: String,
    timestamp: Date
  }],

  // Resume matched during interview
  resumeUsed: mongoose.Schema.Types.ObjectId,

  // Interview Recording/Replay Support
  recordingUrl: String,
  interviewLog: [{
    action: String, // 'question_asked', 'answer_submitted', 'hint_requested', etc.
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  }],

  // Timestamps
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
InterviewSchema.index({ userId: 1, createdAt: -1 });
InterviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', InterviewSchema);
