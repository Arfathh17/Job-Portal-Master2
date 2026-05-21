const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  fileName: String,
  fileUrl: String,
  fileSize: Number,
  mimeType: String,

  // Parsed Content
  fullText: String,

  // Header Information
  header: {
    name: String,
    email: String,
    phone: String,
    location: String,
    linkedIn: String,
    portfolio: String,
    website: String
  },

  // Professional Summary
  summary: String,

  // Skills
  skills: {
    technical: [String],
    soft: [String],
    languages: [String],
    tools: [String],
    frameworks: [String],
    databases: [String],
    platforms: [String]
  },

  // Work Experience
  experience: [{
    companyName: String,
    jobTitle: String,
    duration: {
      startDate: Date,
      endDate: Date,
      current: Boolean
    },
    description: String,
    keyResponsibilities: [String],
    achievements: [String],
    technologiesUsed: [String]
  }],

  // Education
  education: [{
    institution: String,
    degree: String,
    field: String,
    graduationDate: Date,
    gpa: String,
    details: String,
    achievements: [String]
  }],

  // Projects
  projects: [{
    name: String,
    description: String,
    role: String,
    duration: {
      startDate: Date,
      endDate: Date
    },
    technologies: [String],
    achievements: [String],
    link: String,
    gitHub: String
  }],

  // Certifications
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expirationDate: Date,
    credentialId: String,
    credentialUrl: String
  }],

  // Analysis Results
  analysis: {
    atsScore: Number,
    strengthAreas: [String],
    weakAreas: [String],
    yearsOfExperience: Number,
    seniorityLevel: {
      type: String,
      enum: ['entry-level', 'junior', 'mid-level', 'senior', 'lead', 'principal']
    },
    jobFitScore: Number,
    recommendedRoles: [String],
    roleRecommendations: [{
      role: String,
      matchPercentage: Number,
      reason: String,
      matchedSkills: [String],
      missingSkills: [String],
      salaryTrend: String,
      recommendedLearning: [String]
    }],
    jobRecommendations: [{
      id: String,
      title: String,
      company: String,
      location: String,
      type: String,
      source: String,
      applyLink: String,
      description: String,
      salary: mongoose.Schema.Types.Mixed,
      skills: [String],
      matchPercentage: Number,
      matchedSkills: [String]
    }],
    bestCareerPath: String,
    nextTechnologiesToLearn: [String],
    portfolioImprovements: [String],
    suggestedCertifications: [String],
    topHiringCompanies: [String],
    estimatedExperienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    matchedKeywords: [String],
    missingKeywords: [String],
    suggestedImprovements: [String],

    // AI Analysis
    aiInsights: {
      careerTrajectory: String,
      technicalStrengths: [String],
      leadershipIndicators: [String],
      domainExpertise: [String],
      recommendedInterviewFocus: [String]
    }
  },

  // Interview Questions Generated
  generatedQuestions: [{
    question: String,
    category: String,
    relevance: String, // 'high', 'medium', 'low'
    basedOn: String, // skill or experience that generated this
    interviewRound: String
  }],

  // Metadata
  parseQuality: Number, // 0-100
  isVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  },

  lastAnalyzedAt: Date,
  lastUsedInInterview: Date,

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
ResumeSchema.index({ userId: 1, createdAt: -1 });
ResumeSchema.index({ 'skills.technical': 1 });
ResumeSchema.index({ 'analysis.seniorityLevel': 1 });

module.exports = mongoose.model('Resume', ResumeSchema);
