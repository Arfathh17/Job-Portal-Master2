/**
 * Interview Routes
 * Endpoints for interview management
 */

const express = require('express');
const router = express.Router();
const { auth: authMiddleware } = require('../middleware/auth');
const interviewController = require('../controllers/interviewController');

const validators = {
  required: (field, message) => req => {
    const value = req.body?.[field];
    return value === undefined || value === null || value === '' ? message : null;
  },
  inList: (field, values, message) => req => {
    const value = req.body?.[field];
    return value !== undefined && !values.includes(value) ? message : null;
  },
  optionalInList: (field, values, message) => req => {
    const value = req.body?.[field];
    return value !== undefined && value !== null && value !== '' && !values.includes(value) ? message : null;
  },
  intMin: (field, min, message) => req => {
    const value = Number(req.body?.[field]);
    return !Number.isInteger(value) || value < min ? message : null;
  },
  optionalObject: (field, message) => req => {
    const value = req.body?.[field];
    return value !== undefined && (value === null || Array.isArray(value) || typeof value !== 'object') ? message : null;
  },
};

const validate = checks => (req, res, next) => {
  const errors = checks
    .map(check => check(req))
    .filter(Boolean)
    .map(message => ({ msg: message }));

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return next();
};

/**
 * POST /api/interview/start
 * Initialize a new interview session
 */
router.post(
  '/start',
  authMiddleware,
  validate([
    validators.required('role', 'Role is required'),
    validators.inList('difficulty', ['beginner', 'intermediate', 'advanced', 'expert'], 'Invalid difficulty'),
    validators.optionalInList('interviewType', ['behavioral', 'technical', 'coding', 'system-design', 'hr', 'mixed'], 'Invalid interview type'),
    validators.optionalInList('company', ['google', 'amazon', 'microsoft', 'meta', 'apple', 'netflix', 'startup', 'generic'], 'Invalid company'),
    validators.optionalInList('mode', ['text', 'voice', 'video'], 'Invalid mode'),
  ]),
  (req, res) => interviewController.initializeInterview(req, res)
);

/**
 * POST /api/interview/submit-answer
 * Submit an answer and get evaluation
 */
router.post(
  '/submit-answer',
  authMiddleware,
  validate([
    validators.required('interviewId', 'Interview ID is required'),
    validators.required('answer', 'Answer is required'),
    validators.intMin('questionIndex', 0, 'Valid question index is required'),
  ]),
  (req, res) => interviewController.submitAnswer(req, res)
);

/**
 * POST /api/interview/next-question
 * Get the next question with adaptive difficulty
 */
router.post(
  '/next-question',
  authMiddleware,
  validate([
    validators.required('interviewId', 'Interview ID is required'),
    validators.optionalObject('previousPerformance', 'Previous performance must be an object'),
  ]),
  (req, res) => interviewController.getNextQuestion(req, res)
);

/**
 * POST /api/interview/end
 * End the interview session
 */
router.post(
  '/end',
  authMiddleware,
  validate([
    validators.required('interviewId', 'Interview ID is required'),
  ]),
  (req, res) => interviewController.endInterview(req, res)
);

/**
 * GET /api/interview/history
 * Get user's interview history
 */
router.get(
  '/history',
  authMiddleware,
  (req, res) => interviewController.getInterviewHistory(req, res)
);

/**
 * GET /api/interview/:interviewId/report
 * Get detailed interview report
 */
router.get(
  '/:interviewId/report',
  authMiddleware,
  (req, res) => interviewController.getInterviewReport(req, res)
);

module.exports = router;
