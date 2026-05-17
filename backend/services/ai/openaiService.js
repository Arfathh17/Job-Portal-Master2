/**
 * OpenAI Service
 * OpenAI's GPT API integration
 */

const { OpenAI } = require('openai');

let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

class OpenAIService {
  /**
   * Generate interview questions
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
You are an expert technical interviewer for ${company || 'tech companies'}. Generate ${count} interview questions.

Context:
- Role: ${role}
- Difficulty Level: ${difficulty}
- Question Category: ${category}
- Candidate Skills: ${userSkills.join(', ')}
${resumeData ? `- Candidate Background: ${JSON.stringify(resumeData.summary)}` : ''}

Requirements:
1. Questions should be tailored to the ${role} role
2. Match the ${difficulty} difficulty level
3. Avoid repetition of: ${previousAnswers.join(', ') || 'none yet'}
4. Reflect ${company} interview style if applicable

Return ONLY a valid JSON array of objects with this structure:
[
  {
    "question": "Clear, specific question",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "hints": ["hint1", "hint2"],
    "expectedKeyPoints": ["point1", "point2"]
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        top_p: 0.9
      });

      const text = response.choices[0].message.content;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating questions with OpenAI:', error);
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
      difficulty
    } = params;

    const prompt = `
Evaluate this interview answer objectively.

Question: "${question}"
Category: ${category}
Difficulty: ${difficulty}

Candidate's Answer:
"${userAnswer}"

Key Points to Look For:
${expectedKeyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Provide evaluation in JSON format:
{
  "accuracyScore": <0-100>,
  "confidenceScore": <0-100>,
  "technicalDepth": <0-100>,
  "communicationQuality": <0-100>,
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "followUpQuestion": "Next probing question",
  "feedback": "Detailed feedback"
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Evaluate answers fairly and provide constructive feedback. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      });

      const text = response.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error evaluating answer with OpenAI:', error);
      throw new Error(`Failed to evaluate answer: ${error.message}`);
    }
  }

  /**
   * Generate follow-up question
   */
  async generateFollowUp(params) {
    const {
      originalQuestion,
      userAnswer,
      evaluation,
      category,
      difficulty
    } = params;

    const adaptDifficulty = evaluation.technicalDepth >= 70 ? 'increase' : 'decrease';

    const prompt = `
Generate the next interview question based on candidate performance.

Previous Question: "${originalQuestion}"
Candidate's Answer: "${userAnswer}"
Evaluation: Accuracy ${evaluation.accuracyScore}, Technical Depth ${evaluation.technicalDepth}

Generate a follow-up that:
1. Digs deeper into weak areas (if score < 70)
2. Increases difficulty slightly (if score >= 70)
3. Maintains natural interview flow
4. Stays in category: ${category}

Return JSON:
{
  "followUpQuestion": "Clear question",
  "reasoning": "Why this question",
  "adjustedDifficulty": "same|easier|harder",
  "expectedDuration": 120
}

IMPORTANT: Return ONLY JSON, no other text.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating follow-up with OpenAI:', error);
      throw new Error(`Failed to generate follow-up: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive feedback
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
Create professional interview feedback.

Role: ${role}
Company: ${company}
Score: ${overallScore}/100
Strengths: ${strengths.join(', ')}
Weaknesses: ${weaknesses.join(', ')}

Generate comprehensive feedback:
{
  "summary": "Executive summary of performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "topicsToFocus": ["topic1", "topic2"],
  "estimatedTimeToImprove": "X weeks",
  "nextSteps": ["step1", "step2"],
  "companyReadiness": <0-100>
}

Return ONLY JSON.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6
      });

      const text = response.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating feedback with OpenAI:', error);
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
  }

  /**
   * Generate detailed interview report
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
Generate a professional interview report.

Performance Summary:
- Overall Score: ${performanceMetrics.overallScore}
- Technical Score: ${performanceMetrics.technicalScore}
- Communication Score: ${performanceMetrics.communicationScore}

Feedback:
${JSON.stringify(allFeedback, null, 2)}

Create report with:
1. Executive Summary
2. Performance Analysis
3. Strengths
4. Development Areas
5. Learning Recommendations
6. Next Steps

Return JSON format report.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      });

      const text = response.choices[0].message.content;
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating report with OpenAI:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Parse resume
   */
  async parseResume(resumeText) {
    const prompt = `
Extract structured information from this resume:

${resumeText}

Return JSON with:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": ""
  },
  "skills": {
    "technical": [],
    "soft": [],
    "languages": [],
    "tools": []
  },
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "keyAchievements": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "year": ""
    }
  ],
  "yearsOfExperience": 0,
  "strengths": [],
  "suggestedRoles": []
}

Return ONLY JSON.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const text = response.choices[0].message.content;
      return JSON.parse(text);
    } catch (error) {
      console.error('Error parsing resume with OpenAI:', error);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  /**
   * Generate learning path
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
Create a personalized learning path.

Weak Areas: ${weakAreas.join(', ')}
Target: ${targetRole} at ${targetLevel} level
Time: ${timeAvailable}

Generate structured path with milestones, resources, and checkpoints.
Return detailed JSON learning plan.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content;
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating learning path with OpenAI:', error);
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
Analyze this code submission:

Problem: ${problem}
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

Tests: ${JSON.stringify(testResults)}

Analyze for:
- Correctness
- Efficiency (Time & Space)
- Code Quality
- Edge Cases

Return JSON:
{
  "verdict": "pass|fail",
  "score": <0-100>,
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "codeQuality": <0-100>,
  "strengths": [],
  "improvements": [],
  "optimizations": []
}`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      });

      const text = response.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error analyzing code with OpenAI:', error);
      throw new Error(`Failed to analyze code: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
