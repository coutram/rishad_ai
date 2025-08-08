import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { RishadStyleAnalyzer } from './rishad-analyzer.js';
import { StyleTransformer } from './style-transformer.js';
import { ContentAnalyzer } from './content-analyzer.js';
import dotenv from 'dotenv';

dotenv.config();

class RishadAIChatbot {
  constructor() {
    this.app = express();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.analyzer = new RishadStyleAnalyzer();
    this.transformer = new StyleTransformer();
    this.contentAnalyzer = new ContentAnalyzer();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', message: 'Rishad AI Chatbot is running' });
    });

    // Main chat endpoint
    this.app.post('/chat', async (req, res) => {
      try {
        const { message, context = [], stream = false } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        // Check if streaming is requested
        if (stream) {
          return this.handleStreamingChat(req, res, message, context);
        }

        const response = await this.processMessage(message, context);
        res.json({ response });
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Analyze content endpoint
    this.app.post('/analyze', async (req, res) => {
      try {
        const { content, analysisType = 'general' } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
          const demoAnalysis = `Demo Analysis (${analysisType}): 

The reality is that this content represents a fundamental shift in how we think about ${analysisType === 'marketing' ? 'marketing and customer engagement' : analysisType === 'business' ? 'business strategy and operations' : analysisType === 'technology' ? 'technology and digital transformation' : 'content and communication'}.

Here's what's happening: ${content.substring(0, 100)}... represents the kind of thinking that will define the future of ${analysisType === 'marketing' ? 'customer-centric marketing' : analysisType === 'business' ? 'strategic business development' : analysisType === 'technology' ? 'technological innovation' : 'content strategy'}.

What most people miss is that this isn't just about the content itself - it's about understanding the underlying patterns and principles that drive success in today's rapidly evolving landscape.

To get the full AI-powered analysis, please configure your OpenAI API key in the .env file.`;
          
          return res.json({ analysis: demoAnalysis });
        }

        const analysis = await this.analyzer.analyzeContent(content, analysisType);
        res.json({ analysis });
      } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Transform content endpoint
    this.app.post('/transform', async (req, res) => {
      try {
        const { content, preserveMeaning = true, format = 'general' } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
          const demoTransform = `Demo Transformation (${format}):

The truth about ${content.substring(0, 50)}... is that it represents a fundamental opportunity to rethink how we approach ${format === 'blog_post' ? 'content creation and thought leadership' : format === 'tweet' ? 'social media engagement' : format === 'presentation' ? 'strategic communication' : format === 'email' ? 'professional correspondence' : format === 'interview' ? 'thought leadership and insights' : 'content transformation'}.

Here's what's happening: we're seeing a shift from traditional approaches to more dynamic, insight-driven methods that leverage the power of strategic thinking and forward-looking perspectives.

What most people miss is that this transformation isn't just about changing words - it's about fundamentally understanding the underlying principles that make content resonate with audiences and drive meaningful engagement.

To get the full AI-powered transformation, please configure your OpenAI API key in the .env file.`;
          
          return res.json({ transformed: demoTransform });
        }

        let transformed;
        if (format === 'general') {
          transformed = await this.transformer.transformContent(content, preserveMeaning);
        } else {
          transformed = await this.transformer.transformToFormat(content, format);
        }

        res.json({ transformed });
      } catch (error) {
        console.error('Transformation error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get insights endpoint
    this.app.post('/insights', async (req, res) => {
      try {
        const { topic, context = '' } = req.body;
        
        if (!topic) {
          return res.status(400).json({ error: 'Topic is required' });
        }

        const insights = await this.analyzer.getInsights(topic, context);
        res.json({ insights });
      } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Train on new content endpoint
    this.app.post('/train', async (req, res) => {
      try {
        const { content, source } = req.body;
        
        if (!content || !source) {
          return res.status(400).json({ error: 'Content and source are required' });
        }

        const result = await this.analyzer.trainOnContent(content, source);
        res.json({ result });
      } catch (error) {
        console.error('Training error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Multiple format transformation endpoint
    this.app.post('/transform-multiple', async (req, res) => {
      try {
        const { content, formats = ['blog_post', 'tweet', 'presentation'] } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        const results = await this.transformer.transformMultipleFormats(content, formats);
        res.json({ results });
      } catch (error) {
        console.error('Multiple transformation error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Compare content endpoint
    this.app.post('/compare', async (req, res) => {
      try {
        const { content1, content2 } = req.body;
        
        if (!content1 || !content2) {
          return res.status(400).json({ error: 'Both content pieces are required' });
        }

        const comparison = await this.contentAnalyzer.compareContent(content1, content2);
        res.json({ comparison });
      } catch (error) {
        console.error('Comparison error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Suggest improvements endpoint
    this.app.post('/suggest-improvements', async (req, res) => {
      try {
        const { content, improvementType = 'general' } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        const suggestions = await this.contentAnalyzer.suggestImprovements(content, improvementType);
        res.json({ suggestions });
      } catch (error) {
        console.error('Improvement suggestions error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  async processMessage(message, context = []) {
    try {
      // Determine the intent of the message
      const intent = await this.determineIntent(message);
      
      let response;
      
      switch (intent) {
        case 'analyze':
          response = await this.handleAnalysisRequest(message);
          break;
        case 'transform':
          response = await this.handleTransformRequest(message);
          break;
        case 'insights':
          response = await this.handleInsightsRequest(message);
          break;
        case 'train':
          response = await this.handleTrainingRequest(message);
          break;
        case 'help':
          response = this.getHelpMessage();
          break;
        default:
          response = await this.handleGeneralChat(message, context);
      }
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    }
  }

  async determineIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis')) {
      return 'analyze';
    } else if (lowerMessage.includes('transform') || lowerMessage.includes('rewrite') || lowerMessage.includes('style')) {
      return 'transform';
    } else if (lowerMessage.includes('insight') || lowerMessage.includes('perspective') || lowerMessage.includes('think')) {
      return 'insights';
    } else if (lowerMessage.includes('train') || lowerMessage.includes('learn') || lowerMessage.includes('teach')) {
      return 'train';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return 'help';
    }
    
    return 'general';
  }

  async handleAnalysisRequest(message) {
    // Extract content from the message
    const content = this.extractContentFromMessage(message);
    if (!content) {
      return "I'd be happy to analyze content for you. Please provide the content you'd like me to analyze in Rishad's style.";
    }
    
    const analysis = await this.analyzer.analyzeContent(content, 'general');
    return analysis;
  }

  async handleTransformRequest(message) {
    const content = this.extractContentFromMessage(message);
    if (!content) {
      return "I'd be happy to transform content to Rishad's style. Please provide the content you'd like me to transform.";
    }
    
    const transformed = await this.transformer.transformContent(content, true);
    return transformed;
  }

  async handleInsightsRequest(message) {
    const topic = this.extractTopicFromMessage(message);
    if (!topic) {
      return "I'd be happy to provide insights from Rishad's perspective. What topic would you like insights on?";
    }
    
    const insights = await this.analyzer.getInsights(topic);
    return insights;
  }

  async handleTrainingRequest(message) {
    const content = this.extractContentFromMessage(message);
    if (!content) {
      return "I'd be happy to learn from new Rishad content. Please provide the content you'd like me to train on.";
    }
    
    const result = await this.analyzer.trainOnContent(content, 'user_input');
    return result;
  }

  async handleGeneralChat(message, context) {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return `Welcome to Rishad AI! I'm currently running in demo mode. 

To use the full features, please:
1. Get an OpenAI API key from https://platform.openai.com/account/api-keys
2. Add it to your .env file: OPENAI_API_KEY=your_actual_api_key
3. Restart the application

For now, I can help you understand what I can do:
- Analyze content from Rishad's perspective
- Transform content to match his writing style  
- Provide strategic insights on business and marketing topics
- Learn from new Rishad content

What would you like to know about these capabilities?`;
    }

    const systemPrompt = `You are a helpful assistant that can analyze content and provide insights in the style of Rishad Tobaccowala, a legendary advertising and marketing thought leader. 

You can:
1. Analyze content from Rishad's perspective
2. Transform content to match his writing style
3. Provide insights on topics from his viewpoint
4. Learn from new Rishad content

Keep responses conversational, practical, and actionable. Focus on clear, direct insights rather than flowery language. If the user wants to analyze, transform, or get insights, guide them on how to do so.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: message }
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return `I'm having trouble connecting to the AI service. Please check your API key and try again. Error: ${error.message}`;
    }
  }

  extractContentFromMessage(message) {
    // Simple extraction - look for content in quotes or after keywords
    const quoteMatch = message.match(/"([^"]+)"/);
    if (quoteMatch) {
      return quoteMatch[1];
    }
    
    // Look for content after keywords
    const keywords = ['analyze', 'transform', 'rewrite', 'content', 'text'];
    for (const keyword of keywords) {
      if (message.toLowerCase().includes(keyword)) {
        const parts = message.split(keyword);
        if (parts.length > 1) {
          const content = parts[1].trim();
          if (content.length > 10) {
            return content;
          }
        }
      }
    }
    
    return null;
  }

  extractTopicFromMessage(message) {
    // Extract topic after keywords like "insights on", "perspective on", etc.
    const topicKeywords = ['insights on', 'perspective on', 'think about', 'thoughts on'];
    
    for (const keyword of topicKeywords) {
      if (message.toLowerCase().includes(keyword)) {
        const parts = message.split(keyword);
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
    
    // If no specific keyword, try to extract the main topic
    const words = message.split(' ');
    if (words.length > 3) {
      return words.slice(-3).join(' ');
    }
    
    return null;
  }

  getHelpMessage() {
    return `I'm your Rishad AI assistant! Here's what I can do:

📊 **Analyze Content**: I can analyze any content from Rishad's perspective. Just say "analyze this: [content]" or "what would Rishad think about: [content]"

✍️ **Transform Style**: I can rewrite content to match Rishad's writing style. Try "transform this to Rishad's style: [content]" or "rewrite this like Rishad: [content]"

💡 **Get Insights**: I can provide insights on topics from Rishad's perspective. Say "insights on [topic]" or "what's Rishad's take on [topic]"

🎓 **Learn**: I can learn from new Rishad content. Use "train on this content: [content]" or "learn from this: [content]"

Just tell me what you'd like to do!`;
  }

  async handleStreamingChat(req, res, message, context) {
    try {
      // Set headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        const demoResponse = `The reality is that I'm currently running in demo mode with limited capabilities.

Here's what's happening: I can still provide you with insights in Rishad's distinctive style, though I won't be able to access the full AI capabilities until the API key is set up.

What most people miss is that even in demo mode, I can demonstrate the kind of thinking and communication style that Rishad Tobaccowala is known for - forward-thinking, practical, and strategically insightful. The key is focusing on actionable insights rather than just theoretical concepts.

To get the full AI-powered experience, please configure your OpenAI API key in the .env file.`;

        // Stream the demo response character by character
        for (let i = 0; i < demoResponse.length; i++) {
          res.write(demoResponse[i]);
          await new Promise(resolve => setTimeout(resolve, 30)); // 30ms delay between characters
        }
        res.end();
        return;
      }

      // Use OpenAI streaming for real responses
      const systemPrompt = `You are a helpful assistant that can analyze content and provide insights in the style of Rishad Tobaccowala, a legendary advertising and marketing thought leader. 

You can:
1. Analyze content from Rishad's perspective
2. Transform content to match his writing style
3. Provide insights on topics from his viewpoint
4. Learn from new Rishad content

Keep responses conversational, practical, and actionable. Focus on clear, direct insights rather than flowery language. If the user wants to analyze, transform, or get insights, guide them on how to do so.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...context,
        { role: 'user', content: message }
      ];

      const stream = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(content);
        }
      }

      res.end();
    } catch (error) {
      console.error('Streaming chat error:', error);
      res.write('Sorry, I\'m having trouble connecting. Please check your API key and try again.');
      res.end();
    }
  }

  start() {
    const port = process.env.CHATBOT_PORT || 3001;
    this.app.listen(port, () => {
      console.log(`Rishad AI Chatbot running on http://localhost:${port}`);
      console.log('Available endpoints:');
      console.log('  POST /chat - Main chat interface');
      console.log('  POST /analyze - Analyze content');
      console.log('  POST /transform - Transform content style');
      console.log('  POST /insights - Get insights on topics');
      console.log('  POST /train - Train on new content');
      console.log('  GET /health - Health check');
    });
  }
}

// Start the chatbot
const chatbot = new RishadAIChatbot();
chatbot.start(); 