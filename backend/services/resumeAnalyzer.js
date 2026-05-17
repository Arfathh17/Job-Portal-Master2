/**
 * Resume Analyzer Service
 * Uses OpenAI when available, falls back to keyword-based mock analysis
 */
const fs = require('fs');
const path = require('path');


let OpenAI;
let openai = null;
let pdfParse = null;

// Try to initialize OpenAI
try {
  OpenAI = require('openai');
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.startsWith('sk-')) {
    openai = new OpenAI({ apiKey });
    console.log('✅ ResumeAnalyzer: OpenAI connected');
  } else {
    console.log('⚠️  ResumeAnalyzer: No valid OpenAI key — using keyword-based analysis');
  }
} catch (err) {
  console.log('⚠️  ResumeAnalyzer: OpenAI unavailable — using keyword-based analysis');
}

// Try to load pdf-parse
try {
  pdfParse = require('pdf-parse');
} catch (err) {
  console.log('⚠️  pdf-parse not installed — PDF text extraction will use mock data');
}

// ─── Skill keyword database for mock analysis ──────────────────────────────────
const SKILL_CATEGORIES = {
  languages: ['javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'typescript', 'scala', 'r'],
  frontend: ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite'],
  backend: ['node.js', 'express', 'django', 'flask', 'spring', 'fastapi', 'rails', 'laravel', 'asp.net', 'graphql', 'rest api'],
  database: ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'firebase', 'sqlite', 'oracle', 'sql server'],
  cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'ci/cd', 'jenkins', 'github actions'],
  ai_ml: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'data science', 'pandas', 'numpy', 'scikit-learn'],
  tools: ['git', 'jira', 'figma', 'postman', 'vs code', 'linux', 'agile', 'scrum'],
};

class ResumeAnalyzer {
  /**
   * Extract text from a PDF file
   */
  async extractTextFromPDF(filePath) {
    if (pdfParse) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        // Ensure we actually got some text out and it's not binary
        if (data.text && data.text.trim().length > 50 && !data.text.trim().startsWith('%PDF')) {
          return data.text;
        }
        console.warn('PDF extraction resulted in low-quality or binary text. Using mock fallback.');
        return this._getMockResumeText();
      } catch (err) {
        console.error('PDF parse error:', err.message);
        return this._getMockResumeText();
      }
    }

    // Fallback: If pdfParse is not available, we return mock text for PDF files
    // instead of trying to read binary data as UTF-8.
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      return this._getMockResumeText();
    }

    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return this._getMockResumeText();
    }
  }

  /**
   * Analyze resume text — OpenAI or keyword-based mock
   */
  async analyzeResume(resumeText, jobDescription = null) {
    if (openai) {
      return this._analyzeWithAI(resumeText, jobDescription);
    }
    return this._analyzeWithKeywords(resumeText, jobDescription);
  }

  /**
   * OpenAI-powered analysis
   */
  async _analyzeWithAI(resumeText, jobDescription) {
    try {
      const prompt = jobDescription
        ? `You are an expert ATS system, career coach, and technical recruiter. 
           Analyze this resume and compare it with the job description.
           
           Strictly analyze the given content. Do not give generic answers.
           
           INPUT:
           Resume: ${resumeText}
           Job Description: ${jobDescription}
           
           Return a JSON object with:
           - candidateName: (Extracted name or "Candidate")
           - matchScore: (Numeric 0-100)
           - skills: (Array of identified skills)
           - experience: (String describing level)
           - education: (String)
           - strengths: (Array of 3-5 specific strengths)
           - weaknesses: (Array of specific missing skills or gaps)
           - whatToAdd: (Array of tech/projects to improve the resume)
           - jobRoleSuggestions: (Array of 3-5 roles with "Why" explanations)
           - recommendation: (Brief eval summary)`
        : `You are an expert ATS system, career coach, and technical recruiter.
           Analyze the following resume text.
           
           Strictly analyze the given content. Do not give generic answers.
           
           INPUT:
           Resume: ${resumeText}
           
           INSTRUCTIONS:
           1. Extract Candidate Name (or "Candidate")
           2. Provide Detailed Analysis (Summary, Strengths, Weaknesses, Improvements, Skills to Learn)
           3. Suggest Job Roles based ONLY on content.
           4. Generate 3 realistic Job Recommendations (Title, Skills, Match Score, Reason).
           
           Return a valid JSON object ONLY with these fields:
           - candidateName: (Name found in resume)
           - overallScore: (Numeric 0-100)
           - atsScore: (Numeric 0-100)
           - summary: (Professional evaluation summary)
           - skills: (Array of extracted skill strings)
           - experience: (Level of experience)
           - education: (Education history)
           - strengths: (Array of specific strengths found)
           - improvements: (Array of specific weaknesses/gaps)
           - whatToAdd: (Array of suggestions for tech/projects to add)
           - skillsToLearn: (Array of objects {skill, reason} based on market)
           - jobRecommendations: (Array of objects {title, skills, score, reason})
           - recommendation: (Brief evaluation summary for dashboard)`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert resume analyzer. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch {
        return this._parseAnalysis(content);
      }
    } catch (error) {
      console.error('AI Resume analysis error:', error.message);
      // Fallback to keyword analysis
      return this._analyzeWithKeywords(resumeText, jobDescription);
    }
  }

  /**
   * Keyword-based mock analysis (no AI needed)
   */
  _analyzeWithKeywords(resumeText, jobDescription = null) {
    const text = resumeText.toLowerCase();
    const foundSkills = [];
    const categories = {};

    // Scan for known skills
    Object.entries(SKILL_CATEGORIES).forEach(([category, skills]) => {
      const found = skills.filter((skill) => text.includes(skill.toLowerCase()));
      if (found.length > 0) {
        categories[category] = found;
        foundSkills.push(...found);
      }
    });

    // Attempt to extract name from the first non-empty lines
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let candidateName = 'Candidate';
    if (lines.length > 0) {
      // Often the first line is the name. Filter out binary/junk.
      const firstLine = lines[0];
      const isLikelyName =
        firstLine.split(' ').length <= 4 &&
        !/resume|cv|curriculum|%PDF/i.test(firstLine) &&
        /^[a-zA-Z\s]+$/.test(firstLine); // Only letters and spaces

      if (isLikelyName) {
        candidateName = firstLine;
      }
    }

    // Calculate score based on multiple factors
    let score = 40; // Base score
    score += Math.min(foundSkills.length * 3, 25); // Skills: up to 25 points
    if (/education|university|degree|bachelor|master|phd/i.test(text)) score += 10;
    if (/experience|worked|developed|built|managed|led/i.test(text)) score += 10;
    if (/project|portfolio|github|achievement/i.test(text)) score += 8;
    if (/certification|certified|aws|azure|google/i.test(text)) score += 7;
    score = Math.min(score, 98); // Cap at 98

    // Generate experience level
    const yearsMatch = text.match(/(\d+)\+?\s*years?/);
    let experience = 'Entry Level';
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 8) experience = 'Senior Level (8+ years)';
      else if (years >= 5) experience = 'Mid-Senior Level (5-8 years)';
      else if (years >= 3) experience = 'Mid Level (3-5 years)';
      else if (years >= 1) experience = 'Junior Level (1-3 years)';
    }

    // Generate strengths based on what was found
    const strengths = [];
    if (categories.frontend && categories.backend) strengths.push('Full-stack development capability');
    if (categories.cloud) strengths.push('Cloud & DevOps experience');
    if (categories.ai_ml) strengths.push('AI/ML knowledge');
    if (foundSkills.length > 5) strengths.push('Diverse technical skill set');
    if (/leadership|managed|led|team/i.test(text)) strengths.push('Leadership experience');
    if (/open source|github|contribution/i.test(text)) strengths.push('Open source contributions');
    if (strengths.length === 0) strengths.push('Clear resume formatting', 'Relevant technical background');

    // Generate improvements
    const improvements = [];
    if (!categories.cloud) improvements.push('Add cloud platform experience (AWS/Azure/GCP)');
    if (!/quantif|%|percent|increased|reduced|improved by/i.test(text)) improvements.push('Add quantifiable achievements (e.g., "Improved load time by 40%")');
    if (!/certification|certified/i.test(text)) improvements.push('Consider adding relevant certifications');
    if (!/project/i.test(text)) improvements.push('Add a projects section to showcase practical work');
    if (!/summary|objective|about/i.test(text)) improvements.push('Add a professional summary at the top');
    if (improvements.length === 0) improvements.push('Consider adding more industry-specific keywords', 'Expand on project details');

    // ATS Score Logic
    let atsScore = score - 15; // Usually stricter
    if (text.length > 300) atsScore += 5;
    if (/summary|objective/i.test(text)) atsScore += 5;
    if (!/table|columns/i.test(text)) atsScore += 5; // Good ATS parsability
    atsScore = Math.min(Math.max(atsScore, 30), 95);

    // Job Recommendations
    const jobRecommendations = [];
    if (categories.frontend && categories.backend) jobRecommendations.push('Full Stack Developer', 'Software Engineer');
    else if (categories.backend) jobRecommendations.push('Backend Engineer', 'API Developer');
    else if (categories.frontend) jobRecommendations.push('Frontend Developer', 'UI Engineer');
    if (categories.ai_ml) jobRecommendations.push('Machine Learning Engineer', 'Data Scientist');
    if (categories.cloud) jobRecommendations.push('DevOps Engineer', 'Cloud Architect');
    if (jobRecommendations.length === 0) jobRecommendations.push('Associate Developer', 'IT Consultant');

    // Missing Keywords
    const missingKeywords = [];
    if (!categories.tools) missingKeywords.push('Agile methodologies', 'Git workflow');
    if (!categories.cloud) missingKeywords.push('Docker / Containers', 'CI/CD pipeline');
    if (!/database|sql|nosql/i.test(text)) missingKeywords.push('Database management (SQL/NoSQL)');
    if (missingKeywords.length === 0) missingKeywords.push('System Design', 'Performance Optimization');

    return {
      candidateName,
      overallScore: score,
      atsScore,
      summary: score >= 75
        ? 'High-caliber professional record with strong technical alignment. Profile demonstrates significant depth in modern engineering paradigms.'
        : 'Solid foundational background with emerging competencies. Requires strategic optimization of quantifiable impact and niche skill acquisition.',
      matchScore: jobDescription ? score : score,
      skills: foundSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
      experience,
      education: /master|ms |msc/i.test(text) ? "Master's Degree" : /bachelor|bs |bsc|b\.tech/i.test(text) ? "Bachelor's Degree" : 'Advanced Certification',
      strengths,
      improvements,
      whatToAdd: missingKeywords,
      skillsToLearn: [
        { skill: 'Neural Design Patterns', reason: 'Critical for next-gen AI integration and system architecture.' },
        { skill: 'Distributed Consensus', reason: 'High demand for scalable decentralized infrastructure roles.' }
      ],
      jobRecommendations: jobRecommendations.map(title => ({
        title,
        skills: foundSkills.slice(0, 3),
        score: score - Math.floor(Math.random() * 5),
        reason: 'Strong alignment with your core technical vectors and experience level.'
      })),
      recommendation: score >= 75
        ? 'Strong resume! Focus on tailoring it to specific job descriptions for maximum impact.'
        : 'Good foundation. Adding quantifiable achievements would significantly boost your profile.',
      categories,
      mode: 'demo',
    };
  }

  /**
   * Parse free-text analysis into structured data (fallback for AI responses)
   */
  _parseAnalysis(analysisText) {
    const analysis = {
      skills: [],
      experience: '',
      education: '',
      matchScore: 0,
      overallScore: 0,
      atsScore: 0,
      strengths: [],
      improvements: [],
      missingKeywords: [],
      jobRecommendations: [],
      recommendation: '',
    };

    const lines = analysisText.split('\n');
    lines.forEach((line) => {
      if (/match|score|percentage/i.test(line)) {
        const match = line.match(/\d+/);
        if (match) {
          analysis.matchScore = parseInt(match[0]);
          analysis.overallScore = parseInt(match[0]);
        }
      }
    });

    return analysis;
  }

  _getMockResumeText() {
    return 'Experienced software developer with 3+ years in JavaScript, React, Node.js. Bachelor of Science in Computer Science. Built web applications using MongoDB, Express, and deployed on AWS. Proficient in Git, Docker, and agile methodologies.';
  }

  async generateInterviewQuestions(resumeText, role = '') {
    if (openai) {
      try {
        const prompt = `You are an expert technical interviewer.
           Your task is to analyze the given resume and generate ONLY relevant interview questions.
           
           INPUT:
           - Resume Text: ${resumeText}
           ${role ? `- Target Role: ${role}` : ''}
           
           INSTRUCTIONS:
           1. Carefully analyze the resume and extract Skills, Technologies, Projects, and Experience level.
           2. Based on the extracted data, generate relevant interview questions.
           
           QUESTION TYPES TO GENERATE:
           A. Technical Questions (5–7): Based strictly on skills mentioned.
           B. Conceptual Questions (3–5): Core fundamentals related to skills.
           C. Project-Based Questions (VERY IMPORTANT): Ask about specific projects mentioned in the resume.
           D. Basic Questions: If the resume is weak, include beginner-friendly questions.
           
           STRICT RULES:
           - DO NOT act like an interviewer (no "Hello" or conversational text).
           - DO NOT ask questions one by one.
           - DO NOT simulate a conversation.
           - DO NOT give answers.
           - ONLY output a list of questions within the JSON structure.
           - Questions MUST be based on actual resume content.
           
           Return a valid JSON object ONLY with these fields:
           - title: "Relevant Interview Questions Based on Your Resume"
           - categories: (Array of objects {name, questions: []})`;

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an expert technical interviewer. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        });

        return JSON.parse(response.choices[0].message.content);
      } catch (error) {
        console.error('Interview Question Generation Error:', error.message);
      }
    }

    // Mock Fallback
    return {
      title: "Relevant Interview Questions Based on Your Resume",
      categories: [
        { name: 'Technical', questions: ['Explain your experience with the tech stack mentioned.', 'How do you optimize performance in your applications?'] },
        { name: 'Project-Based', questions: ['Walk me through the most challenging part of your main project.', 'How did you handle state management in your web apps?'] },
        { name: 'Behavioral', questions: ['Tell me about a time you resolved a conflict within a team.', 'How do you handle tight deadlines and shifting priorities?'] }
      ]
    };
  }

  async getQuestionAnswer(question) {
    if (openai) {
      try {
        const prompt = `You are an expert technical interviewer.
           Your task is to provide a clear and structured answer to the given interview question.
           
           INPUT:
           Question: ${question}
           
           INSTRUCTIONS:
           1. Provide:
              - Clear explanation
              - Example (if applicable)
              - Real-world usage
           2. Keep answer:
              - Medium length (not too long)
              - Easy to understand
           3. If technical, include a concise code example if relevant.
           
           STYLE:
           - Professional
           - Interview-ready answer`;

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        return response.choices[0].message.content;
      } catch (error) {
        console.error('Answer Generation Error:', error.message);
      }
    }

    return "Sample expert answer: Focus on explaining the architectural decisions and quantifiable impact of your work. Use the STAR method for behavioral questions.";
  }

  async generateResumeScore(resumeText, jobRequirements) {
    const analysis = await this.analyzeResume(resumeText, jobRequirements);
    return {
      score: analysis.matchScore || analysis.overallScore,
      details: analysis,
    };
  }
}

module.exports = new ResumeAnalyzer();
