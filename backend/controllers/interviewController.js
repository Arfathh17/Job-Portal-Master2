/**
 * Interview Controller
 * Manages interview sessions, question generation, answer evaluation, and feedback
 */

const crypto = require('crypto');
const Interview = require('../models/Interview');
const User = require('../models/user');
const Resume = require('../models/Resume');
const InterviewFeedback = require('../models/InterviewFeedback');
const QuestionBank = require('../models/QuestionBank');
const aiFactory = require('../services/ai/aiFactory');
const { roleSpecificQuestions } = require('../services/ai/prompts/interviewPrompts');

class InterviewController {
  /**
   * Initialize a new interview session
   */
  async initializeInterview(req, res) {
    try {
      const { role, difficulty, company, interviewType, mode = 'text' } = req.body;
      const userId = req.user.id;

      // Validate inputs
      if (!role || !difficulty) {
        return res.status(400).json({ error: 'Role and difficulty are required' });
      }

      // Get user profile for context
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's latest resume for skill matching
      const resume = await Resume.findOne({ userId, isActive: true }).sort({ uploadedAt: -1 });

      // Create interview session
      const sessionId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `interview_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const interview = new Interview({
        sessionId,
        userId,
        role,
        difficulty,
        companyMode: company || 'generic',
        interviewType: interviewType || 'mixed',
        mode,
        status: 'in-progress',
        resumeUsed: resume?._id,
        startedAt: new Date()
      });

      await interview.save();

      // Generate first question
      const firstQuestion = await this.generateQuestion(
        interview._id,
        userId,
        role,
        difficulty,
        company,
        user.profile.skills,
        resume
      );

      interview.questions.push({
        question: firstQuestion.question,
        category: firstQuestion.category,
        difficulty: firstQuestion.difficulty,
        askedAt: new Date()
      });

      await interview.save();

      return res.status(201).json({
        success: true,
        sessionId,
        interviewId: interview._id,
        firstQuestion: firstQuestion.question,
        hints: firstQuestion.hints,
        estimatedDuration: 45
      });
    } catch (error) {
      console.error('Error initializing interview:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Submit answer and get evaluation
   */
  async submitAnswer(req, res) {
    try {
      const { interviewId, answer, questionIndex } = req.body;
      const userId = req.user.id;

      // Validate inputs
      if (!interviewId || !answer) {
        return res.status(400).json({ error: 'Interview ID and answer are required' });
      }

      // Get interview
      const interview = await Interview.findById(interviewId);
      if (!interview || interview.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const currentQuestion = interview.questions[questionIndex];
      if (!currentQuestion) {
        return res.status(400).json({ error: 'Question not found' });
      }

      // Store answer
      currentQuestion.answer = answer;
      currentQuestion.timeTaken = Math.floor(Date.now() - new Date(currentQuestion.askedAt).getTime()) / 1000;

      // Evaluate answer using AI
      const evaluation = await aiFactory.evaluateAnswer({
        question: currentQuestion.question,
        userAnswer: answer,
        expectedKeyPoints: [], // Will be enhanced based on resume
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty
      });

      // Store evaluation
      currentQuestion.aiEvaluation = {
        accuracy: evaluation.accuracyScore,
        confidence: evaluation.confidenceScore,
        technicalDepth: evaluation.technicalDepth,
        communicationQuality: evaluation.communicationQuality,
        clarity: Math.floor((evaluation.communicationQuality + evaluation.technicalDepth) / 2),
        followUp: evaluation.followUpQuestion,
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || []
      };

      // Update interview metrics
      interview.correctAnswers += evaluation.accuracyScore >= 70 ? 1 : 0;
      interview.partialAnswers += (evaluation.accuracyScore >= 40 && evaluation.accuracyScore < 70) ? 1 : 0;
      interview.incorrectAnswers += evaluation.accuracyScore < 40 ? 1 : 0;

      await interview.save();

      return res.json({
        success: true,
        evaluation: {
          score: evaluation.accuracyScore,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements
        },
        followUpQuestion: evaluation.followUpQuestion
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get next question with adaptive difficulty
   */
  async getNextQuestion(req, res) {
    try {
      const { interviewId, previousPerformance } = req.body;
      const userId = req.user.id;

      const interview = await Interview.findById(interviewId);
      if (!interview || interview.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const user = await User.findById(userId);
      const resume = await Resume.findById(interview.resumeUsed);

      // Adaptive difficulty based on performance
      let nextDifficulty = interview.difficulty;
      if (previousPerformance) {
        if (previousPerformance.score >= 80) {
          nextDifficulty = interview.difficulty === 'beginner' ? 'intermediate' : 'advanced';
        } else if (previousPerformance.score < 50) {
          nextDifficulty = interview.difficulty === 'advanced' ? 'intermediate' : 'beginner';
        }
      }

      const nextQuestion = await this.generateQuestion(
        interview._id,
        userId,
        interview.role,
        nextDifficulty,
        interview.companyMode,
        user.profile.skills,
        resume
      );

      interview.questions.push({
        question: nextQuestion.question,
        category: nextQuestion.category,
        difficulty: nextQuestion.difficulty,
        askedAt: new Date()
      });

      interview.totalQuestions = interview.questions.length;
      await interview.save();

      return res.json({
        success: true,
        question: nextQuestion.question,
        hints: nextQuestion.hints,
        difficulty: nextQuestion.difficulty,
        questionNumber: interview.questions.length,
        estimatedTime: nextQuestion.estimatedTime || 120
      });
    } catch (error) {
      console.error('Error getting next question:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Generate a question using AI
   */
  async generateQuestion(interviewId, userId, role, difficulty, company, userSkills, resume) {
    try {
      const params = {
        role,
        difficulty,
        company: company || 'generic',
        userSkills,
        count: 1,
        resumeData: resume ? {
          summary: resume.analysis?.aiInsights?.careerTrajectory,
          skills: resume.skills,
          experience: resume.experience?.map(e => e.jobTitle)
        } : null
      };

      const questions = await aiFactory.generateQuestions(params);
      
      if (questions && questions.length > 0) {
        return questions[0];
      }

      throw new Error('No questions generated');
    } catch (error) {
      console.error('Error generating question:', error);
      
      // Fallback to question bank
      const fallbackQuestion = await QuestionBank.findOne({
        role,
        difficulty,
        status: 'approved'
      });

      return fallbackQuestion || {
        question: 'Tell me about a challenging project you worked on and how you solved it.',
        category: 'behavioral',
        difficulty: 'intermediate',
        hints: ['Focus on the problem', 'Explain your approach', 'Discuss the outcome'],
        expectedKeyPoints: ['Problem definition', 'Solution approach', 'Technical details', 'Results']
      };
    }
  }

  /**
   * End interview and generate feedback
   */
  async endInterview(req, res) {
    try {
      const { interviewId } = req.body;
      const userId = req.user.id;

      const interview = await Interview.findById(interviewId);
      if (!interview || interview.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.totalQuestions = interview.questions.length;
      
      // Calculate overall score
      const totalScore = interview.questions.reduce((sum, q) => {
        return sum + (q.aiEvaluation?.accuracy || 0);
      }, 0);
      
      interview.performance.overallScore = Math.round(totalScore / interview.questions.length);
      interview.performance.technicalScore = interview.performance.overallScore;
      interview.performance.communicationScore = Math.round(
        interview.questions.reduce((sum, q) => sum + (q.aiEvaluation?.communicationQuality || 0), 0) /
        interview.questions.length
      );

      await interview.save();

      // Update user stats
      const user = await User.findById(userId);
      user.interviewStats.totalInterviews += 1;
      user.interviewStats.completedInterviews += 1;
      user.interviewStats.lastInterviewDate = new Date();
      
      const currentAverage = user.interviewStats.averageScore;
      user.interviewStats.averageScore = 
        Math.round((currentAverage * (user.interviewStats.completedInterviews - 1) + interview.performance.overallScore) / 
        user.interviewStats.completedInterviews);

      user.learningPath.lastPracticeDate = new Date();
      user.learningPath.practiceStreak = 
        (new Date() - (user.learningPath.lastPracticeDate || new Date())) < 86400000 ? user.learningPath.practiceStreak + 1 : 1;

      await user.save();

      // Generate feedback
      const feedback = await this.generateInterviewFeedback(interview, user);

      return res.json({
        success: true,
        interviewId,
        performance: interview.performance,
        feedback: feedback.feedback,
        reportId: feedback._id
      });
    } catch (error) {
      console.error('Error ending interview:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Generate comprehensive interview feedback
   */
  async generateInterviewFeedback(interview, user) {
    try {
      const questions = interview.questions;
      const strengths = [];
      const weaknesses = [];

      // Analyze patterns
      questions.forEach(q => {
        if (q.aiEvaluation?.accuracy >= 80) {
          strengths.push(...(q.aiEvaluation?.strengths || []));
        } else {
          weaknesses.push(...(q.aiEvaluation?.improvements || []));
        }
      });

      // Generate feedback using AI
      const aiFeedback = await aiFactory.generateFeedback({
        interviewData: interview,
        overallScore: interview.performance.overallScore,
        questionsAnswered: questions.length,
        strengths: [...new Set(strengths)],
        weaknesses: [...new Set(weaknesses)],
        role: interview.role,
        company: interview.companyMode
      });

      // Create feedback document
      const feedbackDoc = new InterviewFeedback({
        interviewId: interview._id,
        userId: interview.userId,
        performance: {
          overallScore: {
            score: interview.performance.overallScore,
            outOf: 100,
            percentile: 75 // TODO: Calculate actual percentile
          },
          technicalScore: {
            score: interview.performance.technicalScore
          },
          communicationScore: {
            score: interview.performance.communicationScore
          }
        },
        feedback: {
          strengths: strengths.map(s => ({ title: s, description: '' })),
          weaknesses: weaknesses.map(w => ({ title: w, description: '' })),
          improvementAreas: aiFeedback.areasForImprovement?.map(area => ({
            topic: area,
            currentLevel: 'intermediate',
            targetLevel: 'advanced',
            estimatedTimeToMaster: '2-3 weeks',
            priority: 'high'
          })) || []
        },
        report: {
          executive_summary: aiFeedback.summary,
          technical_assessment: {
            rating: interview.performance.overallScore >= 70 ? 'Good' : 'Needs Improvement',
            details: aiFeedback.summary
          },
          interview_readiness: {
            score: Math.min(100, interview.performance.overallScore + 10),
            recommendation: aiFeedback.summary
          }
        },
        recommendations: {
          topAreasToFocus: aiFeedback.areasForImprovement || [],
          suggestedPracticeProblems: []
        }
      });

      await feedbackDoc.save();

      return feedbackDoc;
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw error;
    }
  }

  /**
   * Get interview history
   */
  async getInterviewHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, skip = 0 } = req.query;

      const interviews = await Interview.find({ userId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .select('role difficulty companyMode performance completedAt totalQuestions');

      const total = await Interview.countDocuments({ userId, status: 'completed' });

      return res.json({
        success: true,
        interviews,
        total,
        page: Math.ceil(skip / limit) + 1
      });
    } catch (error) {
      console.error('Error getting interview history:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get detailed interview report
   */
  async getInterviewReport(req, res) {
    try {
      const { interviewId } = req.params;
      const userId = req.user.id;

      const interview = await Interview.findById(interviewId);
      if (!interview || interview.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const feedback = await InterviewFeedback.findOne({ interviewId });

      return res.json({
        success: true,
        interview: {
          role: interview.role,
          difficulty: interview.difficulty,
          company: interview.companyMode,
          performance: interview.performance,
          totalQuestions: interview.totalQuestions,
          duration: interview.duration,
          completedAt: interview.completedAt
        },
        feedback: feedback
      });
    } catch (error) {
      console.error('Error getting interview report:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new InterviewController();
