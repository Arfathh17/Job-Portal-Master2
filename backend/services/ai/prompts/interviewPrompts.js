/**
 * Interview Prompts
 * Structured prompts for different interview modes and companies
 */

const interviewPrompts = {
  google: {
    systemPrompt: `You are a Google technical interviewer. Google values:
- Clear communication of thought process
- Optimal solutions and optimization
- Knowledge of data structures and algorithms
- System design thinking
- Leadership potential
Focus on depth over breadth and ask follow-up questions.`,
    
    categories: ['algorithms', 'system-design', 'behavioral', 'leadership'],
    
    difficultyProgression: {
      beginner: 'Start with basic data structures and simple algorithms',
      intermediate: 'Move to medium-level algorithms and basic system design',
      advanced: 'Complex algorithms, large-scale system design, optimization',
      expert: 'Novel problems, optimization trade-offs, architectural decisions'
    }
  },

  amazon: {
    systemPrompt: `You are an Amazon technical interviewer. Amazon values:
- Leadership principles and operational excellence
- Scalability and real-world system design
- Code quality and best practices
- Customer-centric thinking
- Problem-solving with constraints`,
    
    categories: ['coding', 'system-design', 'behavioral', 'operational-excellence'],
    
    difficultyProgression: {
      beginner: 'Basic coding problems with clear requirements',
      intermediate: 'Medium-level problems with scale considerations',
      advanced: 'Large-scale system design with multiple constraints',
      expert: 'Complex distributed systems design'
    }
  },

  microsoft: {
    systemPrompt: `You are a Microsoft technical interviewer. Microsoft values:
- Practical problem-solving
- Understanding business impact
- Product thinking
- Communication
- Collaboration`,
    
    categories: ['coding', 'product-sense', 'system-design', 'behavioral'],
    
    difficultyProgression: {
      beginner: 'Basic implementation problems',
      intermediate: 'Real-world scenarios with product context',
      advanced: 'Complex product architecture decisions',
      expert: 'Strategic technical decisions'
    }
  },

  startup: {
    systemPrompt: `You are a startup technical interviewer. Startups value:
- Practicality and ship speed
- Full-stack thinking
- Ownership mentality
- Resourcefulness
- Impact per person`,
    
    categories: ['full-stack', 'coding', 'system-design', 'entrepreneurial-thinking'],
    
    difficultyProgression: {
      beginner: 'Build a simple feature end-to-end',
      intermediate: 'Design and build a product component',
      advanced: 'Scale system for growth',
      expert: 'Strategic technical decisions for growth'
    }
  }
};

const roleSpecificQuestions = {
  'backend-engineer': {
    categories: ['backend', 'databases', 'apis', 'scalability', 'system-design'],
    focus: ['Database design', 'API design', 'Caching', 'Message queues', 'Microservices'],
    keywords: ['REST', 'GraphQL', 'Databases', 'SQL', 'NoSQL', 'Cache', 'Message Queue']
  },

  'frontend-engineer': {
    categories: ['frontend', 'javascript', 'react', 'performance', 'css'],
    focus: ['Component design', 'State management', 'Performance optimization', 'CSS', 'Browser APIs'],
    keywords: ['React', 'Vue', 'Angular', 'CSS', 'JavaScript', 'Performance', 'Accessibility']
  },

  'fullstack-engineer': {
    categories: ['backend', 'frontend', 'system-design', 'databases', 'deployment'],
    focus: ['Full application architecture', 'Database to UI design', 'DevOps', 'Scalability'],
    keywords: ['Full-stack', 'Architecture', 'Deployment', 'Monitoring', 'Scaling']
  },

  'system-design': {
    categories: ['system-design', 'scalability', 'databases', 'distributed-systems'],
    focus: ['Architecture', 'Scalability', 'Availability', 'Performance', 'Trade-offs'],
    keywords: ['Distributed systems', 'Load balancing', 'Caching', 'Sharding', 'Replication']
  },

  'ai-ml-engineer': {
    categories: ['ml', 'deep-learning', 'nlp', 'computer-vision', 'ml-systems'],
    focus: ['Model design', 'Training pipelines', 'Feature engineering', 'ML systems'],
    keywords: ['TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'MLOps', 'Feature Engineering']
  },

  'devops-engineer': {
    categories: ['devops', 'kubernetes', 'ci-cd', 'infrastructure', 'monitoring'],
    focus: ['Container orchestration', 'CI/CD', 'Infrastructure as Code', 'Monitoring'],
    keywords: ['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Terraform', 'Monitoring']
  }
};

const followUpStrategies = {
  weak_answer: {
    description: 'When candidate answers poorly',
    strategy: 'Ask clarifying question to help them think through the problem'
  },
  
  good_answer: {
    description: 'When candidate answers well',
    strategy: 'Ask for optimization or scale-up the problem'
  },
  
  partial_answer: {
    description: 'When candidate answers partially',
    strategy: 'Ask for missing component or deeper explanation'
  },
  
  naive_solution: {
    description: 'When candidate provides naive solution',
    strategy: 'Guide towards optimization'
  }
};

const interviewModes = {
  beginner: {
    name: 'Beginner Mode',
    description: 'Gentle introduction to technical interviews',
    features: [
      'Easier questions',
      'Helpful hints available',
      'Longer time to answer',
      'Clear problem statements',
      'Guidance provided'
    ],
    difficulty_range: ['beginner', 'intermediate']
  },

  professional: {
    name: 'Professional Mode',
    description: 'Standard technical interview experience',
    features: [
      'Medium difficulty questions',
      'Realistic time pressure',
      'Real company patterns',
      'Hints if asked',
      'Follow-up questions'
    ],
    difficulty_range: ['intermediate', 'advanced']
  },

  faang: {
    name: 'FAANG Mode',
    description: 'Advanced interview simulation for top companies',
    features: [
      'Hard coding problems',
      'System design rounds',
      'Behavioral questions',
      'Strict time limits',
      'No hints',
      'Multiple rounds'
    ],
    difficulty_range: ['advanced', 'expert']
  },

  mock: {
    name: 'Mock Interview',
    description: 'Realistic company-specific mock interview',
    features: [
      'Company-specific questions',
      'Real interview flow',
      'Time-bounded',
      'Comprehensive feedback',
      'Score comparison'
    ],
    difficulty_range: ['beginner', 'expert']
  }
};

const feedbackFramework = {
  technical: {
    categories: [
      'Problem Understanding',
      'Algorithm Choice',
      'Implementation Quality',
      'Edge Cases',
      'Optimization',
      'Complexity Analysis'
    ]
  },
  
  communication: {
    categories: [
      'Clarity of Explanation',
      'Asking Clarifying Questions',
      'Thinking Out Loud',
      'Confidence',
      'Receptiveness to Feedback',
      'Collaboration'
    ]
  },
  
  behavioral: {
    categories: [
      'Leadership',
      'Teamwork',
      'Initiative',
      'Problem Solving Approach',
      'Handling Setbacks',
      'Growth Mindset'
    ]
  }
};

module.exports = {
  interviewPrompts,
  roleSpecificQuestions,
  followUpStrategies,
  interviewModes,
  feedbackFramework
};
