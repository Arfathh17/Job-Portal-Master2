/**
 * Resume Routes
 * Endpoints for resume management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth: authMiddleware } = require('../middleware/auth');
const resumeController = require('../controllers/resumeController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * POST /api/resume/analyze-text
 * Analyze pasted resume text and recommend suitable job roles
 */
router.post(
  '/analyze-text',
  authMiddleware,
  (req, res) => resumeController.analyzeResumeText(req, res)
);

/**
 * POST /api/resume/upload
 * Upload and parse a resume
 */
router.post(
  '/upload',
  authMiddleware,
  upload.single('resume'),
  (req, res) => resumeController.uploadResume(req, res)
);

/**
 * GET /api/resume/list
 * Get user's resumes
 */
router.get(
  '/list',
  authMiddleware,
  (req, res) => resumeController.getUserResumes(req, res)
);

/**
 * GET /api/resume/history
 * Backward-compatible alias for user's resume history
 */
router.get(
  '/history',
  authMiddleware,
  (req, res) => resumeController.getUserResumes(req, res)
);

/**
 * GET /api/resume/:resumeId/questions
 * Get interview questions generated from resume
 */
router.get(
  '/:resumeId/questions',
  authMiddleware,
  (req, res) => resumeController.getResumeBasedQuestions(req, res)
);

/**
 * GET /api/resume/:resumeId
 * Get resume details
 */
router.get(
  '/:resumeId',
  authMiddleware,
  (req, res) => resumeController.getResumeDetails(req, res)
);

/**
 * DELETE /api/resume/:resumeId
 * Delete resume
 */
router.delete(
  '/:resumeId',
  authMiddleware,
  (req, res) => resumeController.deleteResume(req, res)
);

/**
 * POST /api/resume/analyze-skills
 * Analyze resume skills for a target role
 */
router.post(
  '/analyze-skills',
  authMiddleware,
  (req, res) => resumeController.analyzeSkillsForRole(req, res)
);

module.exports = router;
