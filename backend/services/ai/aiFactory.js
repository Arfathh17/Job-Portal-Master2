/**
 * AI Service Factory
 * Abstraction layer for OpenAI and Gemini APIs
 * Provides unified interface for AI operations
 */

const openaiService = require('./openaiService');
const geminiService = require('./geminiService');

class AIFactory {
  constructor(provider = 'gemini') {
    this.provider = provider;
    this.service = provider === 'openai' ? openaiService : geminiService;
  }

  async generateQuestions(params) {
    return this.service.generateQuestions(params);
  }

  async evaluateAnswer(params) {
    return this.service.evaluateAnswer(params);
  }

  async generateFollowUp(params) {
    return this.service.generateFollowUp(params);
  }

  async generateFeedback(params) {
    return this.service.generateFeedback(params);
  }

  async generateInterviewReport(params) {
    return this.service.generateInterviewReport(params);
  }

  async parseResume(resumeText) {
    return this.service.parseResume(resumeText);
  }

  async generateLearningPath(params) {
    return this.service.generateLearningPath(params);
  }

  async analyzeCodingSubmission(params) {
    return this.service.analyzeCodingSubmission(params);
  }

  setProvider(provider) {
    this.provider = provider;
    this.service = provider === 'openai' ? openaiService : geminiService;
  }
}

module.exports = new AIFactory(process.env.AI_PROVIDER || 'gemini');
