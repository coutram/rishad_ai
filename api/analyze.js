import { 
  setCORSHeaders, 
  handlePreflight, 
  validateMethod, 
  validateFields, 
  handleError,
  isOpenAIConfigured,
  generateDemoResponse,
  getAnalyzer
} from './_utils.js';

export default async function handler(req, res) {
  // Set CORS headers
  setCORSHeaders(res);

  // Handle preflight requests
  if (handlePreflight(req, res)) return;

  // Validate request method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    // Validate required fields
    if (!validateFields(req, res, ['content'])) return;

    const { content, analysisType = 'general' } = req.body;

    // Check if OpenAI API key is configured
    if (!isOpenAIConfigured()) {
      const demoAnalysis = generateDemoResponse('analysis', content, analysisType);
      return res.json({ analysis: demoAnalysis });
    }

    const analyzer = getAnalyzer();
    const analysis = await analyzer.analyzeContent(content, analysisType);
    res.json({ analysis });
  } catch (error) {
    handleError(res, error, 'Analysis');
  }
} 