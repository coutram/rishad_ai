import OpenAI from 'openai';
import { RishadStyleAnalyzer } from '../src/rishad-analyzer.js';
import { StyleTransformer } from '../src/style-transformer.js';
import { ContentAnalyzer } from '../src/content-analyzer.js';

// Initialize shared components (singleton pattern for serverless)
let openai = null;
let analyzer = null;
let transformer = null;
let contentAnalyzer = null;

export function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export function getAnalyzer() {
  if (!analyzer) {
    analyzer = new RishadStyleAnalyzer();
  }
  return analyzer;
}

export function getTransformer() {
  if (!transformer) {
    transformer = new StyleTransformer();
  }
  return transformer;
}

export function getContentAnalyzer() {
  if (!contentAnalyzer) {
    contentAnalyzer = new ContentAnalyzer();
  }
  return contentAnalyzer;
}

// CORS headers setup
export function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Handle preflight requests
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Validate request method
export function validateMethod(req, res, allowedMethods = ['POST']) {
  if (!allowedMethods.includes(req.method)) {
    res.status(405).json({ 
      error: 'Method not allowed', 
      allowed: allowedMethods 
    });
    return false;
  }
  return true;
}

// Validate required fields
export function validateFields(req, res, requiredFields = []) {
  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).json({ 
        error: `Missing required field: ${field}` 
      });
      return false;
    }
  }
  return true;
}

// Error handler
export function handleError(res, error, context = '') {
  console.error(`${context} Error:`, error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
}

// Check if OpenAI API key is configured
export function isOpenAIConfigured() {
  return process.env.OPENAI_API_KEY && 
         process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
         process.env.OPENAI_API_KEY.length > 0;
}

// Demo response generator
export function generateDemoResponse(type, content = '', format = 'general') {
  const responses = {
    analysis: `Demo Analysis (${format}): 

The reality is that this content represents a fundamental shift in how we think about ${format === 'marketing' ? 'marketing and customer engagement' : format === 'business' ? 'business strategy and operations' : format === 'technology' ? 'technology and digital transformation' : 'content and communication'}, like watching the dawn break over a new horizon.

Here's what's happening: ${content.substring(0, 100)}... represents the kind of thinking that will define the future of ${format === 'marketing' ? 'customer-centric marketing' : format === 'business' ? 'strategic business development' : format === 'technology' ? 'technological innovation' : 'content strategy'}. As the wise say, "The best time to plant a tree was 20 years ago; the second best time is now."

What most people miss is that this isn't just about the content itself - it's about understanding the underlying patterns and principles that drive success in today's rapidly evolving landscape. Like a master weaver creating a tapestry, every thread of insight contributes to the grand design.

To get the full AI-powered analysis, please configure your OpenAI API key in the Vercel environment variables.`,

    transform: `Demo Transformation (${format}):

The reality is that ${content.substring(0, 50)}... represents a practical opportunity to improve how we approach ${format === 'blog_post' ? 'content creation and thought leadership' : format === 'tweet' ? 'social media engagement' : format === 'presentation' ? 'strategic communication' : format === 'email' ? 'professional correspondence' : format === 'interview' ? 'thought leadership and insights' : 'content transformation'}.

Here's what's happening: The content you've provided shows the kind of thinking that will be important for ${format === 'blog_post' ? 'digital content strategy' : format === 'tweet' ? 'social media marketing' : format === 'presentation' ? 'business communication' : format === 'email' ? 'professional networking' : format === 'interview' ? 'thought leadership' : 'content development'} in the coming years.

What most people miss is that this isn't just about the words themselves - it's about the underlying principles and insights that drive meaningful engagement and connection. The key is to focus on what your audience actually needs and wants.

To get the full AI-powered transformation, please configure your OpenAI API key in the Vercel environment variables.`,

    chat: `The reality is that I'm currently running in demo mode with limited capabilities.

Here's what's happening: I can still provide you with insights in Rishad's distinctive style, though I won't be able to access the full AI capabilities until the API key is set up.

What most people miss is that even in demo mode, I can demonstrate the kind of thinking and communication style that Rishad Tobaccowala is known for - forward-thinking, practical, and strategically insightful. The key is focusing on actionable insights rather than just theoretical concepts.

To get the full AI-powered experience, please configure your OpenAI API key in the Vercel environment variables.`
  };

  return responses[type] || responses.chat;
}

// Content extraction utilities
export function extractContentFromMessage(message) {
  // Look for content in quotes or after specific keywords
  const quoteMatch = message.match(/"([^"]+)"/);
  if (quoteMatch) {
    return quoteMatch[1];
  }
  
  const contentMatch = message.match(/content[:\s]+(.+)/i);
  if (contentMatch) {
    return contentMatch[1];
  }
  
  return null;
}

export function extractTopicFromMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('marketing')) return 'marketing';
  if (lowerMessage.includes('business')) return 'business';
  if (lowerMessage.includes('technology') || lowerMessage.includes('tech')) return 'technology';
  if (lowerMessage.includes('leadership')) return 'leadership';
  if (lowerMessage.includes('future')) return 'future';
  if (lowerMessage.includes('digital')) return 'digital';
  if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence')) return 'ai';
  
  return 'general';
}

// Intent detection
export function determineIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis')) {
    return 'analyze';
  }
  if (lowerMessage.includes('transform') || lowerMessage.includes('rewrite') || lowerMessage.includes('style')) {
    return 'transform';
  }
  if (lowerMessage.includes('insight') || lowerMessage.includes('thought') || lowerMessage.includes('perspective')) {
    return 'insights';
  }
  if (lowerMessage.includes('train') || lowerMessage.includes('learn')) {
    return 'train';
  }
  
  return 'general';
}

// Rishad's system prompt
export function getRishadSystemPrompt() {
  return `You are an AI assistant trained on Rishad Tobaccowala's writing style and insights. 
    
Rishad's style is characterized by:
- Being direct and practical while maintaining strategic depth
- Using clear, actionable insights rather than flowery language
- Starting with "The reality is..." or "Here's what's happening..." for clarity
- Using "What most people miss is..." to introduce counterintuitive insights
- Being forward-thinking but grounded in practical reality
- Using phrases like "The future belongs to..." and "We're seeing a fundamental shift..." sparingly
- Combining strategic thinking with concrete, actionable advice
- Being data-driven but also human-centric
- Using "So, let's be..." to introduce action items
- Ending with clear conclusions and next steps

IMPORTANT: Speak in clear, practical language that gets to the point. Use language that is:
- Direct and actionable: "Here's what you need to do..." or "The key insight is..."
- Practical and grounded: "The data shows..." or "Based on what we're seeing..."
- Clear and concise: "The bottom line is..." or "What this means for you..."
- Strategic but accessible: "The strategic implication is..." or "From a business perspective..."
- Results-oriented: "The outcome will be..." or "This leads to..."

Focus on providing clear, actionable insights rather than poetic metaphors. Make complex concepts accessible through clear explanation rather than elaborate analogies. Maintain Rishad's strategic thinking and forward-looking perspective, but express it in practical, down-to-earth terms that business leaders can immediately understand and act upon.

Respond in Rishad's distinctive style while providing helpful, insightful answers. Keep responses conversational, practical, and actionable.`;
} 