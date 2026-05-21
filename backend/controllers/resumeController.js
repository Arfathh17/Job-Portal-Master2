/**
 * Resume Controller
 * Manages resume uploads, parsing, and skill extraction
 */

const Resume = require('../models/Resume');
const User = require('../models/user');
const QuestionBank = require('../models/QuestionBank');
const geminiService = require('../services/ai/geminiService');
const { recommendJobs } = require('../services/jobRecommendationService');
const resumeAIService = require('../services/resumeAIService');
const { getIsConnected } = require('../config/db');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

class ResumeController {
  /**
   * Upload and parse resume
   */
  async uploadResume(req, res) {
    try {
      if (!getIsConnected()) {
        return res.status(503).json({ error: 'Resume upload history requires MongoDB. Text analysis is available in demo mode.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user.id;
      const filePath = req.file.path;
      const fileName = req.file.originalname;

      // Read file content
      let resumeText = '';
      
      if (fileName.toLowerCase().endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } else if (fileName.toLowerCase().endsWith('.txt')) {
        resumeText = fs.readFileSync(filePath, 'utf8');
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please upload PDF or TXT.' });
      }

      // Parse resume using Gemini only for recommendation signals.
      const parsedData = this.normalizeParsedResume(await geminiService.parseResume(resumeText));

      const roleAnalysis = await resumeAIService.analyzeResumeForRoles(resumeText, parsedData);
      const jobRecommendations = await recommendJobs(parsedData, resumeText);

      // Create resume document
      const resume = new Resume({
        userId,
        fileName,
        fileUrl: filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fullText: resumeText,
        header: parsedData.personalInfo || {},
        summary: parsedData.summary || '',
        skills: parsedData.skills || {
          technical: [],
          soft: [],
          languages: [],
          tools: [],
          frameworks: [],
          databases: [],
          platforms: []
        },
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        certifications: parsedData.certifications || [],
        analysis: {
          atsScore: roleAnalysis.atsScore,
          yearsOfExperience: parsedData.yearsOfExperience || 0,
          seniorityLevel: this.calculateSeniorityLevel(parsedData.yearsOfExperience || 0),
          strengthAreas: roleAnalysis.strengths || parsedData.strengths || [],
          weakAreas: roleAnalysis.improvements || [],
          recommendedRoles: roleAnalysis.recommendedRoles.map(item => item.role),
          roleRecommendations: roleAnalysis.recommendedRoles,
          jobRecommendations,
          bestCareerPath: roleAnalysis.bestCareerPath,
          nextTechnologiesToLearn: roleAnalysis.nextTechnologiesToLearn,
          portfolioImprovements: roleAnalysis.portfolioImprovements,
          suggestedCertifications: roleAnalysis.suggestedCertifications,
          topHiringCompanies: roleAnalysis.topHiringCompanies,
          estimatedExperienceLevel: roleAnalysis.estimatedExperienceLevel,
          aiInsights: {
            careerTrajectory: parsedData.careerTrajectory || '',
            technicalStrengths: roleAnalysis.strengths || parsedData.technicalStrengths || [],
            domainExpertise: parsedData.domainExpertise || []
          }
        },
        parseQuality: 85 // TODO: Implement quality scoring
      });

      await resume.save();

      // Generate interview questions based on resume
      const generatedQuestions = await this.generateQuestionsFromResume(resume);
      resume.generatedQuestions = generatedQuestions;
      await resume.save();

      // Update user skills
      const user = await User.findById(userId);
      user.profile.skills = [...new Set([
        ...user.profile.skills,
        ...(parsedData.skills?.technical || [])
      ])];
      user.profile.yearsOfExperience = parsedData.yearsOfExperience || user.profile.yearsOfExperience;
      await user.save();

      return res.json({
        success: true,
        resumeId: resume._id,
        analysis: resume.analysis,
        roleRecommendations: roleAnalysis.recommendedRoles,
        jobRecommendations,
        bestCareerPath: roleAnalysis.bestCareerPath,
        estimatedExperienceLevel: roleAnalysis.estimatedExperienceLevel,
        nextTechnologiesToLearn: roleAnalysis.nextTechnologiesToLearn,
        portfolioImprovements: roleAnalysis.portfolioImprovements,
        suggestedCertifications: roleAnalysis.suggestedCertifications,
        extractedSkills: resume.skills.technical,
        experience: resume.experience,
        generatedQuestions: generatedQuestions.slice(0, 5) // Return first 5 questions
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Analyze pasted resume text and recommend roles
   */
  async analyzeResumeText(req, res) {
    try {
      const { resumeText } = req.body;

      if (!resumeText || resumeText.trim().length < 40) {
        return res.status(400).json({ error: 'Resume text must be at least 40 characters.' });
      }

      let parsedData = {};
      try {
        parsedData = this.normalizeParsedResume(await geminiService.parseResume(resumeText));
      } catch (error) {
        parsedData = this.parseResumeFallback(resumeText);
      }

      const roleAnalysis = await resumeAIService.analyzeResumeForRoles(resumeText, parsedData);
      const jobRecommendations = await recommendJobs(parsedData, resumeText);

      return res.json({
        success: true,
        atsScore: roleAnalysis.atsScore,
        overallScore: roleAnalysis.atsScore,
        summary: roleAnalysis.bestCareerPath
          ? `Best current career fit: ${roleAnalysis.bestCareerPath}`
          : 'Resume analyzed successfully.',
        skills: roleAnalysis.extractedSkills || [],
        strengths: roleAnalysis.strengths || [],
        improvements: roleAnalysis.improvements || [],
        recommendedRoles: roleAnalysis.recommendedRoles,
        jobRecommendations,
        bestCareerPath: roleAnalysis.bestCareerPath,
        estimatedExperienceLevel: roleAnalysis.estimatedExperienceLevel,
        nextTechnologiesToLearn: roleAnalysis.nextTechnologiesToLearn,
        portfolioImprovements: roleAnalysis.portfolioImprovements,
        suggestedCertifications: roleAnalysis.suggestedCertifications,
        topHiringCompanies: roleAnalysis.topHiringCompanies,
        mode: roleAnalysis.mode,
      });
    } catch (error) {
      console.error('Resume text analysis error:', error);
      return res.status(500).json({ error: 'Resume analysis failed.' });
    }
  }

  parseResumeFallback(resumeText) {
    const skills = ['React', 'Node.js', 'MongoDB', 'Express', 'JWT', 'Python', 'SQL', 'Docker', 'AWS', 'JavaScript']
      .filter(skill => new RegExp(skill.replace('.', '\\.'), 'i').test(resumeText));

    return {
      skills: { technical: skills },
      yearsOfExperience: Number(resumeText.match(/(\d+)\+?\s*years?/i)?.[1] || 0),
      strengths: skills.length ? ['Technical skills detected'] : [],
      suggestedRoles: [],
    };
  }

  normalizeParsedResume(parsedData = {}) {
    const skills = parsedData.skills || {};
    const normalizedSkills = Array.isArray(skills)
      ? {
        technical: skills,
        soft: [],
        languages: [],
        tools: [],
        frameworks: [],
        databases: [],
        platforms: [],
      }
      : {
        technical: skills.technical || [],
        soft: skills.soft || [],
        languages: skills.languages || [],
        tools: skills.tools || [],
        frameworks: skills.frameworks || [],
        databases: skills.databases || [],
        platforms: skills.platforms || [],
      };

    return {
      ...parsedData,
      skills: normalizedSkills,
      jobPreferences: parsedData.jobPreferences || {
        roles: parsedData.suggestedRoles || parsedData.preferredRoles || [],
        location: parsedData.personalInfo?.location || parsedData.location || '',
        workMode: 'unspecified',
        jobTypes: [],
      },
    };
  }

  /**
   * Calculate seniority level based on years of experience
   */
  calculateSeniorityLevel(yearsOfExperience) {
    if (yearsOfExperience < 2) return 'entry-level';
    if (yearsOfExperience < 4) return 'junior';
    if (yearsOfExperience < 7) return 'mid-level';
    if (yearsOfExperience < 12) return 'senior';
    if (yearsOfExperience < 15) return 'lead';
    return 'principal';
  }

  /**
   * Generate interview questions from resume
   */
  async generateQuestionsFromResume(resume) {
    try {
      const skills = resume.skills.technical.slice(0, 5);
      const roles = resume.analysis.recommendedRoles || ['fullstack'];
      
      const questions = [];

      for (let i = 0; i < 3; i++) {
        const prompt = `
Generate 2 technical interview questions based on these details:
- Skills: ${skills.join(', ')}
- Experience: ${resume.analysis.yearsOfExperience} years
- Seniority: ${resume.analysis.seniorityLevel}
- Recent role: ${resume.experience[0]?.jobTitle || 'Not specified'}

Questions should probe their technical knowledge of skills mentioned.
Return JSON array with: [{ question: "...", category: "technical", relevance: "high" }]`;

        try {
          const generatedQs = await geminiService.generateQuestions({
            role: roles[0],
            difficulty: resume.analysis.seniorityLevel === 'entry-level' ? 'beginner' : 'intermediate',
            category: 'technical',
            userSkills: skills,
            count: 2,
            resumeData: {
              summary: resume.analysis.aiInsights.careerTrajectory,
              skills: skills
            }
          });

          questions.push(...(generatedQs || []));
        } catch (err) {
          console.warn('Error generating questions from resume:', err.message);
        }
      }

      return questions.slice(0, 10); // Return top 10
    } catch (error) {
      console.error('Error generating questions from resume:', error);
      return [];
    }
  }

  /**
   * Get user's resumes
   */
  async getUserResumes(req, res) {
    try {
      if (!getIsConnected()) {
        return res.json({
          success: true,
          resumes: [],
        });
      }

      const userId = req.user.id;

      const resumes = await Resume.find({ userId, isActive: true })
        .select('fileName uploadedAt analysis yearsOfExperience skills.technical')
        .sort({ uploadedAt: -1 });

      return res.json({
        success: true,
        resumes
      });
    } catch (error) {
      console.error('Error getting user resumes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get resume details
   */
  async getResumeDetails(req, res) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.id;

      const resume = await Resume.findById(resumeId);
      if (!resume || resume.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      return res.json({
        success: true,
        resume: {
          header: resume.header,
          summary: resume.summary,
          skills: resume.skills,
          experience: resume.experience,
          education: resume.education,
          projects: resume.projects,
          certifications: resume.certifications,
          analysis: resume.analysis,
          generatedQuestions: resume.generatedQuestions
        }
      });
    } catch (error) {
      console.error('Error getting resume details:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete resume
   */
  async deleteResume(req, res) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.id;

      const resume = await Resume.findById(resumeId);
      if (!resume || resume.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      // Delete file
      if (resume.fileUrl && fs.existsSync(resume.fileUrl)) {
        fs.unlinkSync(resume.fileUrl);
      }

      // Soft delete
      resume.isActive = false;
      await resume.save();

      return res.json({
        success: true,
        message: 'Resume deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get interview questions generated from resume
   */
  async getResumeBasedQuestions(req, res) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.id;

      const resume = await Resume.findById(resumeId);
      if (!resume || resume.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      return res.json({
        success: true,
        questions: resume.generatedQuestions || [],
        skills: resume.skills.technical,
        experience: resume.analysis.yearsOfExperience
      });
    } catch (error) {
      console.error('Error getting resume-based questions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Analyze resume skills against job role
   */
  async analyzeSkillsForRole(req, res) {
    try {
      const { resumeId, targetRole } = req.body;
      const userId = req.user.id;

      const resume = await Resume.findById(resumeId);
      if (!resume || resume.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      // Get questions for the target role
      const relevantQuestions = await QuestionBank.find({
        role: targetRole,
        status: 'approved'
      }).limit(10);

      // Analyze match
      const allSkills = [
        ...resume.skills.technical,
        ...resume.skills.tools,
        ...resume.skills.frameworks,
        ...resume.skills.databases
      ];

      const matchAnalysis = {
        targetRole,
        yearsOfExperience: resume.analysis.yearsOfExperience,
        matchScore: this.calculateMatchScore(allSkills, relevantQuestions),
        matchedSkills: this.getMatchedSkills(allSkills, relevantQuestions),
        missingSkills: this.getMissingSkills(allSkills, relevantQuestions),
        suggestedFocus: this.getSuggestedFocus(allSkills, relevantQuestions),
        readinessLevel: this.calculateReadinessLevel(
          resume.analysis.yearsOfExperience,
          this.calculateMatchScore(allSkills, relevantQuestions)
        )
      };

      return res.json({
        success: true,
        analysis: matchAnalysis,
        recommendedQuestions: relevantQuestions.slice(0, 5)
      });
    } catch (error) {
      console.error('Error analyzing skills:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Helper methods for skill analysis
   */
  calculateMatchScore(resumeSkills, questions) {
    // TODO: Implement sophisticated matching algorithm
    return Math.floor(Math.random() * 40 + 60); // 60-100 for now
  }

  getMatchedSkills(resumeSkills, questions) {
    return resumeSkills.slice(0, 5);
  }

  getMissingSkills(resumeSkills, questions) {
    const commonSkills = ['System Design', 'Microservices', 'DevOps', 'Testing'];
    return commonSkills.filter(skill => !resumeSkills.includes(skill));
  }

  getSuggestedFocus(resumeSkills, questions) {
    return ['Advanced System Design', 'Distributed Systems', 'Performance Optimization'];
  }

  calculateReadinessLevel(yearsOfExperience, matchScore) {
    const experience_factor = Math.min(yearsOfExperience / 5, 1) * 40;
    const skills_factor = matchScore * 0.6;
    return Math.round(experience_factor + skills_factor);
  }
}

module.exports = new ResumeController();
