const mongoose = require('mongoose');

const QuestionBankSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },

  // Question Classification
  category: {
    type: String,
    enum: ['behavioral', 'technical', 'coding', 'system-design', 'ml', 'database', 'devops', 'communication'],
    required: true
  },

  subCategory: String, // e.g., 'React', 'Database Design', 'Leadership'

  role: {
    type: String,
    enum: ['frontend', 'backend', 'fullstack', 'devops', 'ai-ml', 'system-design', 'product-manager', 'all'],
    default: 'all'
  },

  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },

  // Company-specific
  company: {
    type: String,
    enum: ['google', 'amazon', 'microsoft', 'meta', 'apple', 'netflix', 'generic'],
    default: 'generic'
  },

  // Question Details
  description: String,
  context: String,
  keywords: [String],
  followUpQuestions: [String],

  // Answer Reference
  expectedAnswerOutline: String,
  keyPoints: [String],
  commonMistakes: [String],
  bestPractices: [String],

  // For Coding Questions
  isCodingQuestion: {
    type: Boolean,
    default: false
  },

  codingDetails: {
    language: [String], // ['python', 'javascript', 'java', etc.]
    timeLimit: Number,
    memoryLimit: Number,
    difficulty: String,
    testCases: [{
      input: String,
      expectedOutput: String
    }],
    sampleInput: String,
    sampleOutput: String,
    explanation: String
  },

  // Question Stats
  popularity: { type: Number, default: 0 },
  difficulty_rating: { type: Number, default: 0 },
  timesAsked: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },

  // AI Evaluation Criteria
  evaluationCriteria: {
    accuracy: {
      weight: Number,
      description: String
    },
    completeness: {
      weight: Number,
      description: String
    },
    clarity: {
      weight: Number,
      description: String
    },
    technicalDepth: {
      weight: Number,
      description: String
    }
  },

  // Tags for matching
  tags: [String],

  // Created by
  createdBy: String,
  approvedBy: String,

  // Status
  status: {
    type: String,
    enum: ['draft', 'approved', 'archived'],
    default: 'approved'
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

// Indexes for fast queries
QuestionBankSchema.index({ category: 1, role: 1, difficulty: 1 });
QuestionBankSchema.index({ company: 1, role: 1 });
QuestionBankSchema.index({ keywords: 1 });
QuestionBankSchema.index({ status: 1 });

module.exports = mongoose.model('QuestionBank', QuestionBankSchema);
