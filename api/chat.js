import { 
  setCORSHeaders, 
  handlePreflight, 
  validateMethod, 
  validateFields, 
  handleError,
  isOpenAIConfigured,
  generateDemoResponse,
  getOpenAI,
  getAnalyzer,
  getTransformer,
  getContentAnalyzer,
  determineIntent,
  extractContentFromMessage,
  extractTopicFromMessage,
  getRishadSystemPrompt
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
    if (!validateFields(req, res, ['message'])) return;

    const { message, context = [], stream = false } = req.body;
    
    // Check if streaming is requested
    if (stream) {
      await handleStreamingResponse(message, context, res);
    } else {
      const response = await processMessage(message, context);
      res.json({ response });
    }
  } catch (error) {
    handleError(res, error, 'Chat');
  }
}

async function handleStreamingResponse(message, context, res) {
  try {
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      const demoResponse = generateDemoResponse('chat');
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Stream the demo response character by character
      for (let i = 0; i < demoResponse.length; i++) {
        res.write(demoResponse[i]);
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between characters
      }
      res.end();
      return;
    }

    // Determine intent
    const intent = determineIntent(message);
    let responseText = '';
    
    switch (intent) {
      case 'analyze':
        responseText = await handleAnalysisRequest(message);
        break;
      case 'transform':
        responseText = await handleTransformRequest(message);
        break;
      case 'insights':
        responseText = await handleInsightsRequest(message);
        break;
      case 'train':
        responseText = await handleTrainingRequest(message);
        break;
      default:
        responseText = await handleGeneralChatStreaming(message, context, res);
        return; // handleGeneralChatStreaming handles its own streaming
    }

    // Stream the response
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Stream the response character by character
    for (let i = 0; i < responseText.length; i++) {
      res.write(responseText[i]);
      await new Promise(resolve => setTimeout(resolve, 30)); // 30ms delay between characters
    }
    res.end();
    
  } catch (error) {
    console.error('Streaming error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error: Unable to process request');
  }
}

async function handleGeneralChatStreaming(message, context, res) {
  try {
    const openai = getOpenAI();
    const systemPrompt = getRishadSystemPrompt();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: message }
    ];

    // Set up streaming response headers
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(content);
        // Small delay to make typing effect more natural
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Streaming chat completion error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error: Unable to process request');
  }
}

async function processMessage(message, context = []) {
  try {
    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return generateDemoResponse('chat');
    }

    // Determine intent
    const intent = determineIntent(message);
    
    switch (intent) {
      case 'analyze':
        return await handleAnalysisRequest(message);
      case 'transform':
        return await handleTransformRequest(message);
      case 'insights':
        return await handleInsightsRequest(message);
      case 'train':
        return await handleTrainingRequest(message);
      default:
        return await handleGeneralChat(message, context);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    return "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.";
  }
}

async function handleAnalysisRequest(message) {
  const content = extractContentFromMessage(message);
  const topic = extractTopicFromMessage(message);
  
  if (!content) {
    return "I'd be happy to analyze content for you. Please provide the content you'd like me to analyze, and I'll share insights in Rishad's style.";
  }
  
  try {
    const analyzer = getAnalyzer();
    const analysis = await analyzer.analyzeContent(content, topic);
    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    return "I encountered an issue while analyzing the content. Please try again.";
  }
}

async function handleTransformRequest(message) {
  const content = extractContentFromMessage(message);
  
  if (!content) {
    return "I'd be happy to transform content into Rishad's style. Please provide the content you'd like me to transform.";
  }
  
  try {
    const transformer = getTransformer();
    const transformed = await transformer.transformContent(content, true);
    return transformed;
  } catch (error) {
    console.error('Transform error:', error);
    return "I encountered an issue while transforming the content. Please try again.";
  }
}

async function handleInsightsRequest(message) {
  const topic = extractTopicFromMessage(message);
  
  try {
    const contentAnalyzer = getContentAnalyzer();
    const insights = await contentAnalyzer.getInsights(topic);
    return insights;
  } catch (error) {
    console.error('Insights error:', error);
    return "I encountered an issue while generating insights. Please try again.";
  }
}

async function handleTrainingRequest(message) {
  return "Training functionality is not available in the deployed version. The AI has already been trained on Rishad's content and is ready to help you.";
}

async function handleGeneralChat(message, context) {
  try {
    const openai = getOpenAI();
    const systemPrompt = getRishadSystemPrompt();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Chat completion error:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
  }
} 