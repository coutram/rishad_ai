import { 
  setCORSHeaders, 
  handlePreflight, 
  validateMethod, 
  validateFields, 
  handleError,
  isOpenAIConfigured,
  generateDemoResponse,
  getTransformer
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

    const { content, preserveMeaning = true, format = 'general' } = req.body;

    // Check if OpenAI API key is configured
    if (!isOpenAIConfigured()) {
      const demoTransform = generateDemoResponse('transform', content, format);
      return res.json({ transformed: demoTransform });
    }

    const transformer = getTransformer();
    const transformed = await transformer.transformContent(content, preserveMeaning, format);
    res.json({ transformed });
  } catch (error) {
    handleError(res, error, 'Transform');
  }
} 