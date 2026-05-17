/**
 * Gemini AI Service
 * Google's Generative AI API integration
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { interviewPrompts } = require('../ai/prompts/interviewPrompts');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DEFAULT_GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || DEFAULT_GEMINI_MODEL;

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
    this.visionModel = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_VISION_MODEL });
  }

  /**
   * Generate interview questions based on user profile and resume
   */
  async generateQuestions(params) {
    const {
      role,
      difficulty,
      category,
      company,
      userSkills,
      count = 5,
      previousAnswers = [],
      resumeData = null
    } = params;

    const prompt = `
You are an expert technical interviewer. Generate ${count} interview questions.

Context:
- Role: ${role}
- Difficulty: ${difficulty}
- Category: ${category}
- Company: ${company}
- User Skills: ${userSkills.join(', ')}
${resumeData ? `- Resume Background: ${JSON.stringify(resumeData)}` : ''}
${previousAnswers.length > 0 ? `- Previous Questions Asked: ${previousAnswers.join(', ')}` : ''}

Generate questions that are:
1. Aligned with the role and difficulty level
2. Relevant to the user's skills and experience
3. Different from previously asked questions
4. Following ${company} interview patterns if applicable

Return ONLY a JSON array with this structure:
[
  {
    "question": "Question text",
    "category": "Category",
    "difficulty": "Difficulty level",
    "hints": ["hint1", "hint2"],
    "expectedKeyPoints": ["point1", "point2"]
  }
]`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Evaluate user's answer
   */
  async evaluateAnswer(params) {
    const {
      question,
      userAnswer,
      expectedKeyPoints,
      category,
      difficulty,
      previousAnswers = null
    } = params;

    const prompt = `
You are an expert interviewer evaluating a candidate's response.

Question: ${question}
Category: ${category}
Difficulty: ${difficulty}

User's Answer:
"${userAnswer}"

Expected Key Points:
${expectedKeyPoints.map(point => `- ${point}`).join('\n')}

Evaluate the answer and provide:
1. Accuracy Score (0-100)
2. Confidence Level (0-100)
3. Technical Depth (0-100)
4. Communication Quality (0-100)
5. Key Strengths in the answer
6. Areas for improvement
7. Follow-up question to probe deeper
8. Overall feedback

Return ONLY a JSON object with this structure:
{
  "accuracyScore": 85,
  "confidenceScore": 75,
  "technicalDepth": 80,
  "communicationQuality": 70,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "followUpQuestion": "Next question to ask",
  "feedback": "Overall feedback text"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw new Error(`Failed to evaluate answer: ${error.message}`);
    }
  }

  /**
   * Generate follow-up question based on answer
   */
  async generateFollowUp(params) {
    const {
      originalQuestion,
      userAnswer,
      evaluation,
      category,
      difficulty,
      interviewMode = 'adaptive'
    } = params;

    const prompt = `
You are an expert technical interviewer generating follow-up questions.

Original Question: ${originalQuestion}
User's Answer: "${userAnswer}"
Answer Evaluation: Accuracy ${evaluation.accuracyScore}, Technical Depth ${evaluation.technicalDepth}

Generate the next question that:
1. Probes deeper into areas where the candidate was weak
2. Escalates difficulty slightly if they performed well
3. Maintains interview flow
4. Is relevant to the category: ${category}
5. Interview Mode: ${interviewMode}

Return ONLY a JSON object:
{
  "followUpQuestion": "Question text",
  "reasoning": "Why this question",
  "adjustedDifficulty": "same|easier|harder",
  "expectedDuration": "time in seconds"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error generating follow-up:', error);
      throw new Error(`Failed to generate follow-up: ${error.message}`);
    }
  }

  /**
   * Generate detailed feedback after interview
   */
  async generateFeedback(params) {
    const {
      interviewData,
      overallScore,
      questionsAnswered,
      strengths,
      weaknesses,
      role,
      company
    } = params;

    const prompt = `
You are an expert career coach providing feedback after a technical interview.

Interview Summary:
- Role Applied: ${role}
- Company: ${company}
- Overall Score: ${overallScore}/100
- Total Questions: ${questionsAnswered.length}
- Strengths: ${strengths.join(', ')}
- Weaknesses: ${weaknesses.join(', ')}

Provide comprehensive feedback in JSON format:
{
  "summary": "Executive summary",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "resourcesRecommended": ["resource1", "resource2"],
  "estimatedTimeToImprove": "X weeks",
  "nextSteps": ["step1", "step2"],
  "readinessLevel": "percentage"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive interview report
   */
  async generateInterviewReport(params) {
    const {
      userId,
      interviewId,
      sessionData,
      performanceMetrics,
      allFeedback
    } = params;

    const prompt = `
Generate a detailed interview report based on comprehensive interview data.

Performance Metrics:
${JSON.stringify(performanceMetrics, null, 2)}

Feedback Summary:
${JSON.stringify(allFeedback, null, 2)}

Create a professional report with:
1. Executive Summary
2. Technical Assessment
3. Communication Assessment
4. Strengths & Weaknesses
5. Recommendations
6. Learning Path
7. Interview Readiness

Return JSON format with detailed report structure.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Parse resume text and extract information
   */
  async parseResume(resumeText) {
    const prompt = `
Parse this resume and extract structured information:

Resume:
${resumeText}

Return JSON with:
{
  "personalInfo": {...},
  "skills": [...],
  "experience": [...],
  "education": [...],
  "projects": [...],
  "certifications": [...],
  "yearsOfExperience": number,
  "strengths": [...],
  "suggestedRoles": [...]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('Gemini resume parsing unavailable, falling back:', error.message);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  /**
   * Generate personalized learning path
   */
  async generateLearningPath(params) {
    const {
      weakAreas,
      targetRole,
      currentLevel,
      targetLevel,
      timeAvailable
    } = params;

    const prompt = `
Create a personalized learning path for career development.

Weak Areas: ${weakAreas.join(', ')}
Target Role: ${targetRole}
Current Level: ${currentLevel}
Target Level: ${targetLevel}
Time Available: ${timeAvailable}

Generate structured learning path with:
1. Weekly milestones
2. Topic breakdown
3. Resources
4. Practice problems
5. Checkpoints

Return JSON format.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Error generating learning path:', error);
      throw new Error(`Failed to generate learning path: ${error.message}`);
    }
  }

  /**
   * Analyze coding submission
   */
  async analyzeCodingSubmission(params) {
    const {
      problem,
      code,
      language,
      testResults,
      expectedOutput
    } = params;

    const prompt = `
Analyze this coding submission:

Problem: ${problem}
Language: ${language}
Code:
\`\`\`
${code}
\`\`\`

Test Results: ${JSON.stringify(testResults)}

Analyze and provide:
{
  "verdict": "pass|fail",
  "score": number,
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "codeQuality": number,
  "strengths": [...],
  "improvements": [...],
  "optimizations": [...],
  "edgeCases": [...]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error analyzing code:', error);
      throw new Error(`Failed to analyze code: ${error.message}`);
    }
  }
}

module.exports = new GeminiService();
