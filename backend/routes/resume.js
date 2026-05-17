const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const resumeAnalyzer = require('../services/resumeAnalyzer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/resumes/'))
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext === '.pdf' || ext === '.doc' || ext === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed'));
    }
  }
});

// Upload and analyze resume
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text from PDF
    const resumeText = await resumeAnalyzer.extractTextFromPDF(req.file.path);
    
    // Analyze resume
    const analysis = await resumeAnalyzer.analyzeResume(resumeText);

    res.json({
      success: true,
      filename: req.file.filename,
      analysis: analysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Resume analysis failed' });
  }
});

// Match resume with job
router.post('/match', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    const analysis = await resumeAnalyzer.analyzeResume(resumeText, jobDescription);
    
    res.json({
      success: true,
      matchScore: analysis.matchScore,
      analysis: analysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Matching failed' });
  }
});

// Generate interview questions
router.post('/interview-questions', async (req, res) => {
  try {
    const { resumeText, role } = req.body;
    const questions = await resumeAnalyzer.generateInterviewQuestions(resumeText, role);
    res.json({ success: true, questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Interview question generation failed' });
  }
});

// Get answer for a question
router.post('/question-answer', async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await resumeAnalyzer.getQuestionAnswer(question);
    res.json({ success: true, answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Answer generation failed' });
  }
});

module.exports = router;
