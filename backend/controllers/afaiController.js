const afaiService = require('../services/afai');
const { getIsConnected } = require('../config/db');
const Interview = require('../models/Interview');

function validateSetup(body) {
  if (!body.role || !body.experience) {
    return 'Role and experience are required';
  }
  return null;
}

class AFAIController {
  async persistTurn(sessionId, role, content) {
    if (!getIsConnected() || !sessionId || !content) return;
    await Interview.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          conversation: {
            role,
            content,
            at: new Date(),
          },
        },
      },
    );
  }

  startSession(req, res) {
    return this.startSessionAsync(req, res);
  }

  async startSessionAsync(req, res) {
    try {
      const error = validateSetup(req.body);
      if (error) return res.status(400).json({ error });

      const sessionId = afaiService.createSession({
        role: req.body.role,
        experience: req.body.experience,
        technologies: req.body.technologies,
        interviewType: req.body.interviewType,
        difficulty: req.body.difficulty,
        company: req.body.company,
      });

      if (getIsConnected() && req.user?.id) {
        await Interview.findOneAndUpdate(
          { sessionId },
          {
            sessionId,
            afaiSessionId: sessionId,
            userId: req.user.id,
            role: req.body.role,
            interviewType: req.body.interviewType || 'mixed',
            difficulty: req.body.difficulty || 'intermediate',
            companyMode: req.body.company || 'generic',
            mode: 'text',
            status: 'in-progress',
            setup: {
              role: req.body.role,
              experience: req.body.experience,
              technologies: req.body.technologies || [],
              interviewType: req.body.interviewType,
              difficulty: req.body.difficulty,
              company: req.body.company,
            },
            startedAt: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }

      return res.json({ success: true, sessionId });
    } catch (error) {
      console.error('AFAI start error:', error);
      return res.status(500).json({ error: 'Failed to start AFAI session' });
    }
  }

  async sendMessage(req, res) {
    try {
      if (!req.body.message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await afaiService.processMessage({
        sessionId: req.body.sessionId,
        message: req.body.message,
        role: req.body.role || 'General',
        experience: req.body.experience || 'Not specified',
        history: req.body.history || [],
        technologies: req.body.technologies,
        interviewType: req.body.interviewType,
        difficulty: req.body.difficulty,
        company: req.body.company,
      });

      await this.persistTurn(req.body.sessionId || response.sessionId, 'user', req.body.message);
      await this.persistTurn(response.sessionId, 'assistant', response.reply);

      return res.json({ success: true, ...response });
    } catch (error) {
      console.error('AFAI message error:', error);
      return res.status(500).json({ error: 'Interview processing failed' });
    }
  }

  async streamMessage(req, res) {
    try {
      if (!req.body.message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      req.on('close', () => {
        res.end();
      });

      await afaiService.streamMessage(res, {
        sessionId: req.body.sessionId,
        message: req.body.message,
        role: req.body.role || 'General',
        experience: req.body.experience || 'Not specified',
        technologies: req.body.technologies,
        interviewType: req.body.interviewType,
        difficulty: req.body.difficulty,
        company: req.body.company,
      });
    } catch (error) {
      console.error('AFAI stream error:', error);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Stream failed' });
      }
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`);
      return res.end();
    }
  }

  async summarize(req, res) {
    try {
      if (!req.body.sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const summary = await afaiService.generateSummary(req.body.sessionId);
      if (!summary) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (getIsConnected()) {
        await Interview.findOneAndUpdate(
          { sessionId: req.body.sessionId },
          {
            status: 'completed',
            completedAt: new Date(),
            totalQuestions: summary.totalQuestions,
            afaiSummary: summary,
            feedback: {
              summary: summary.aiSummary,
              strengths: summary.strengths || [],
              weaknesses: summary.weaknesses || [],
              recommendations: summary.learningPath || [],
              topicsToFocus: summary.technicalGaps || [],
            },
            performance: {
              overallScore: summary.averageScore || 0,
              technicalScore: summary.scoreBreakdown?.technicalSkill || 0,
              communicationScore: summary.scoreBreakdown?.communication || 0,
              problemSolvingScore: summary.scoreBreakdown?.problemSolving || 0,
              averageConfidence: summary.scoreBreakdown?.confidence || 0,
              averageAccuracy: summary.scoreBreakdown?.technicalAccuracy || 0,
              interviewReadiness: summary.averageScore || 0,
            },
          },
          { new: true },
        );
      }

      return res.json({ success: true, summary });
    } catch (error) {
      console.error('AFAI summary error:', error);
      return res.status(500).json({ error: 'Summary generation failed' });
    }
  }
}

module.exports = new AFAIController();
