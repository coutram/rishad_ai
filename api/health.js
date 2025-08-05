import { 
  setCORSHeaders, 
  handlePreflight, 
  validateMethod 
} from './_utils.js';

export default function handler(req, res) {
  // Set CORS headers
  setCORSHeaders(res);

  // Handle preflight requests
  if (handlePreflight(req, res)) return;

  // Validate request method
  if (!validateMethod(req, res, ['GET'])) return;

  res.json({ 
    status: 'ok', 
    message: 'Rishad AI Chatbot is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    features: ['chat', 'analyze', 'transform']
  });
} 