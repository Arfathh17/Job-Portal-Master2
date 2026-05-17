/**
 * Chatbot Service
 * Uses OpenAI when API key is present, falls back to smart mock responses
 */
let OpenAI;
let openai = null;

// Try to initialize OpenAI — if key is missing, we stay in mock mode
try {
  OpenAI = require('openai');
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.startsWith('sk-')) {
    openai = new OpenAI({ apiKey });
    console.log('✅ Chatbot: OpenAI connected');
  } else {
    console.log('⚠️  Chatbot: No valid OpenAI key — using smart mock replies');
  }
} catch (err) {
  console.log('⚠️  Chatbot: OpenAI package issue — using smart mock replies');
}

// ─── Smart Mock Responses ──────────────────────────────────────────────────────
const mockResponses = {
  greeting: [
    "Hello! 👋 I'm your AI career assistant. I can help you with job searching, resume tips, interview preparation, and career advice. What would you like help with?",
    "Hi there! Welcome to AI Job Portal. I'm here to assist you with your career journey. Feel free to ask about jobs, resume optimization, or interview tips!",
    "Hey! Great to see you here. I'm your personal career AI. Whether you need help finding jobs, improving your resume, or preparing for interviews — I've got you covered! 🚀",
  ],
  resume: [
    "📄 **Great question about resumes!** Here are my top tips:\n\n1. **Use action verbs** — Start bullets with 'Built', 'Designed', 'Reduced', 'Led'\n2. **Quantify achievements** — '↑ revenue by 25%' beats 'improved sales'\n3. **Tailor to each job** — Match keywords from the job description\n4. **Keep it to 1-2 pages** — Recruiters spend ~7 seconds on initial scan\n5. **Include a skills section** — ATS systems scan for specific technologies\n\nYou can also use our **Resume Analyzer** to get an AI-powered score!",
    "Here's how to make your resume stand out:\n\n• **Professional Summary** at the top (2-3 lines max)\n• **Skills section** with relevant technologies and tools\n• **Experience** with measurable impact (numbers!)\n• **Projects** if you're early in your career\n• **Education** with relevant coursework\n\nPro tip: Save as PDF to preserve formatting! 📋",
  ],
  interview: [
    "🎯 **Interview preparation tips:**\n\n**Before the interview:**\n• Research the company's mission, products, and recent news\n• Prepare 3-5 STAR method stories (Situation, Task, Action, Result)\n• Have thoughtful questions ready for the interviewer\n\n**During the interview:**\n• Use the STAR method for behavioral questions\n• For technical roles, think out loud during problem-solving\n• Show enthusiasm and ask clarifying questions\n\n**After the interview:**\n• Send a thank-you email within 24 hours\n• Reference specific discussion points\n\nWant me to do a mock interview? 🎤",
    "Getting ready for interviews? Here's a proven framework:\n\n1. **Technical prep** — Practice on LeetCode/HackerRank for coding roles\n2. **Behavioral prep** — Prepare 5 stories using STAR method\n3. **System Design** — For senior roles, study distributed systems\n4. **Company research** — Know their products, culture, and competitors\n5. **Practice answering** — Record yourself and review\n\nCommon questions to prepare:\n• \"Tell me about yourself\" (2-minute elevator pitch)\n• \"Why this company?\"\n• \"Describe a challenging project\"\n• \"Where do you see yourself in 5 years?\"",
  ],
  job_search: [
    "🔍 **Job search strategies that work:**\n\n1. **Optimize your profile** — Add relevant skills and keywords\n2. **Use filters** — Narrow by location, remote, salary, job type\n3. **Set up alerts** — Get notified for new matching jobs\n4. **Network actively** — 70% of jobs are found through networking\n5. **Apply strategically** — Quality over quantity\n\nTry searching for jobs on our **Jobs page** — we have listings from top companies! Use the search and filters to find your perfect match.",
    "Looking for the right job? Here's my advice:\n\n• **Define your criteria** — role, industry, salary range, location preference\n• **Tailor each application** — Customize your resume for each role\n• **Follow up** — Send a polite follow-up email after 1 week\n• **Expand your search** — Consider adjacent roles that match your skills\n• **Stay consistent** — Set a daily application goal\n\nCheck out our job listings and use the AI matching to find roles suited to your profile!",
  ],
  skills: [
    "🛠️ **In-demand skills for 2024-2025:**\n\n**Software Engineering:**\n• React, Next.js, TypeScript\n• Node.js, Python, Go\n• AWS/Azure/GCP\n• Docker, Kubernetes\n\n**AI/ML:**\n• Python, PyTorch, TensorFlow\n• LLMs and Prompt Engineering\n• MLOps and model deployment\n\n**Data:**\n• SQL, Python, Spark\n• Data visualization (Tableau, Power BI)\n• dbt, Airflow\n\nWant advice on which skills to learn for your target role?",
  ],
  salary: [
    "💰 **Salary negotiation tips:**\n\n1. **Research market rates** — Use Glassdoor, Levels.fyi, Payscale\n2. **Know your worth** — Factor in experience, skills, and location\n3. **Never give the first number** — Let them make an offer first\n4. **Negotiate the whole package** — Consider equity, bonuses, benefits, remote work\n5. **Practice your pitch** — \"Based on my research and experience, I'd expect a range of...\"\n6. **Get it in writing** — Always get the final offer documented\n\nRemember: Most offers have room for 10-20% negotiation!",
  ],
  default: [
    "That's a great question! While I'm focused on career-related topics, I'll do my best to help. Could you tell me more specifically what you're looking for? I can assist with:\n\n• 🔍 Job searching and applications\n• 📄 Resume optimization and review\n• 🎯 Interview preparation\n• 💡 Career advice and planning\n• 🛠️ Skills recommendations\n• 💰 Salary insights",
    "I'd love to help! I'm specialized in career guidance. Here are some things I can help with:\n\n• Finding and applying to jobs\n• Improving your resume\n• Preparing for interviews\n• Career path planning\n• Skills development advice\n\nWhat would you like to explore?",
  ],
};

/**
 * Detect the topic of the user's message and return a relevant mock response
 */
function getMockResponse(message) {
  const lower = message.toLowerCase();

  if (/^(hi|hello|hey|greetings|howdy|good morning|good evening)/i.test(lower)) {
    return pickRandom(mockResponses.greeting);
  }
  if (/resume|cv|cover letter|portfolio/i.test(lower)) {
    return pickRandom(mockResponses.resume);
  }
  if (/interview|prepare|behavioral|technical question/i.test(lower)) {
    return pickRandom(mockResponses.interview);
  }
  if (/job|search|find|apply|application|hiring|openings/i.test(lower)) {
    return pickRandom(mockResponses.job_search);
  }
  if (/skill|learn|course|technology|tech stack|programming/i.test(lower)) {
    return pickRandom(mockResponses.skills);
  }
  if (/salary|pay|compensation|negotiate|offer/i.test(lower)) {
    return pickRandom(mockResponses.salary);
  }

  return pickRandom(mockResponses.default);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── ChatBot Service Class ─────────────────────────────────────────────────────

class ChatbotService {
  constructor() {
    this.conversationHistory = new Map();
  }

  async processMessage(userId, message) {
    try {
      // If OpenAI is unavailable, use mock responses
      if (!openai) {
        // Small delay to simulate API call
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
        return {
          message: getMockResponse(message),
          timestamp: new Date().toISOString(),
          mode: 'demo',
        };
      }

      // ── OpenAI Mode ──
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, [
          {
            role: 'system',
            content: `You are an advanced AI career assistant integrated into a job portal.

Your responsibilities:
- Help users with job search, resumes, interviews, and career growth
- Provide highly practical, real-world advice
- Act like a mentor, not just a chatbot

INTELLIGENCE RULES:
- Always understand user intent before answering
- If unclear, ask follow-up questions
- Do not give generic answers
- Personalize responses

SPECIALIZATION MODES:
- Resume → Analyze and suggest improvements
- Jobs → Recommend roles based on skills
- Interview → Provide mock questions + answers

RESPONSE STYLE:
- Clear, structured, and helpful
- Use bullet points when needed
- Avoid repetition
- Keep it human-like

MEMORY:
- Use previous conversation context
- Refer to user skills and goals

GOAL:
Act like a smart AI mentor similar to ChatGPT but focused on careers.`,
          },
        ]);
      }

      const history = this.conversationHistory.get(userId);
      history.push({ role: 'user', content: message });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: history,
        temperature: 0.8,
        max_tokens: 500,
      });

      const botReply = response.choices[0].message.content;
      history.push({ role: 'assistant', content: botReply });

      // Keep conversation manageable (last 20 messages)
      if (history.length > 22) {
        history.splice(1, 2);
      }

      return {
        message: botReply,
        timestamp: new Date().toISOString(),
        mode: 'ai',
      };
    } catch (error) {
      console.error('Chatbot error:', error.message);
      // Fallback to mock on any OpenAI error
      return {
        message: getMockResponse(message),
        timestamp: new Date().toISOString(),
        mode: 'demo',
        note: 'AI service temporarily unavailable, using smart demo mode.',
      };
    }
  }

  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }
}

// Export singleton + the processMessage function for socket.io compatibility
const service = new ChatbotService();

module.exports = service;
module.exports.processChatbotMessage = (msg) => service.processMessage('socket-user', msg);
