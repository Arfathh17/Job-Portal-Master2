const mongoose = require('mongoose');

const InterviewFeedbackSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Overall Performance
  performance: {
    overallScore: {
      score: Number,
      outOf: { type: Number, default: 100 },
      percentile: Number // User's percentile vs all users
    },
    
    technicalScore: {
      score: Number,
      breakdown: {
        problemSolving: Number,
        codeQuality: Number,
        optimization: Number,
        dataStructures: Number
      }
    },

    communicationScore: {
      score: Number,
      breakdown: {
        clarity: Number,
        articulation: Number,
        listeningComprehension: Number,
        explanationQuality: Number
      }
    },

    behavioralScore: {
      score: Number,
      breakdown: {
        professionalism: Number,
        conflictResolution: Number,
        leadershipTrait: Number,
        teamwork: Number
      }
    }
  },

  // Detailed Feedback
  feedback: {
    // Strengths
    strengths: [{
      title: String,
      description: String,
      evidenceFromInterview: String,
      frequency: Number // how many times demonstrated
    }],

    // Weaknesses
    weaknesses: [{
      title: String,
      description: String,
      evidenceFromInterview: String,
      impactLevel: { type: String, enum: ['low', 'medium', 'high'] },
      suggestionForImprovement: String
    }],

    // Areas of Improvement
    improvementAreas: [{
      topic: String,
      currentLevel: String,
      targetLevel: String,
      estimatedTimeToMaster: String,
      resources: [String],
      priority: { type: String, enum: ['low', 'medium', 'high'] }
    }],

    // Specific Feedback by Question
    questionFeedback: [{
      question: String,
      answer: String,
      evaluation: String,
      score: Number,
      strengths: [String],
      improvements: [String],
      correctAnswer: String
    }]
  },

  // AI-Generated Report
  report: {
    executive_summary: String,
    
    technical_assessment: {
      rating: String,
      details: String,
      example_questions_handled: [String],
      example_questions_struggled: [String]
    },

    communication_assessment: {
      rating: String,
      details: String,
      speaking_style: String,
      clarity_level: String
    },

    behavioral_assessment: {
      rating: String,
      details: String,
      cultural_fit: String
    },

    interview_readiness: {
      score: Number,
      recommendation: String,
      readyFor: [String], // ['google', 'startups', etc.]
      notReadyFor: [String]
    }
  },

  // Recommendations
  recommendations: {
    topAreasToFocus: [String],
    suggestedPracticeProblems: [String],
    recommendedCourses: [String],
    bookRecommendations: [String],
    nextInterviewSuggestion: String,
    estimatedTimeToBeReady: String
  },

  // Comparative Analysis
  comparison: {
    vsUserAverage: {
      betterThan: Boolean,
      percentageChange: Number
    },
    vsOtherUsers: {
      percentile: Number,
      totalUsersCompared: Number
    },
    trend: String // 'improving', 'stable', 'declining'
  },

  // Action Items
  actionItems: [{
    action: String,
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    dueDate: Date,
    estimatedHours: Number
  }],

  // Interview Readiness for Specific Companies
  companyReadiness: [{
    companyName: String,
    readinessScore: Number,
    strengths: [String],
    weaknesses: [String],
    estimatedTimeToPrep: String
  }],

  // Learning Resources
  resources: [{
    type: String, // 'video', 'article', 'course', 'book', 'practice'
    title: String,
    link: String,
    difficulty: String,
    estimatedTime: Number,
    relevantFor: [String] // topics it covers
  }],

  // Follow-up Interview Suggestion
  suggestedFollowUp: {
    topic: String,
    difficulty: String,
    company: String,
    estimatedWaitTime: Number // days
  },

  // Timestamps
  generatedAt: {
    type: Date,
    default: Date.now
  },

  reviewedBy: String, // if manually reviewed
  reviewedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
InterviewFeedbackSchema.index({ interviewId: 1 });
InterviewFeedbackSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewFeedback', InterviewFeedbackSchema);
