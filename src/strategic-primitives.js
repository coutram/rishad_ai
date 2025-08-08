import fs from 'fs/promises';
import path from 'path';

class StrategicPrimitivesAnalyzer {
  constructor() {
    this.primitives = null;
    this.loadPrimitives();
  }

  async loadPrimitives() {
    try {
      const profilePath = path.join(process.cwd(), 'models', 'rishad_style_profile.json');
      const profileData = await fs.readFile(profilePath, 'utf8');
      const profile = JSON.parse(profileData);
      this.primitives = profile.strategic_primitives || {};
    } catch (error) {
      console.error('Error loading strategic primitives:', error);
      this.primitives = {};
    }
  }

  detectTopic(message) {
    const lowerMessage = message.toLowerCase();
    
    // Topic detection with weighted scoring
    const topicScores = {};
    
    // Strategy-related keywords
    if (lowerMessage.includes('strategy') || lowerMessage.includes('strategic') || 
        lowerMessage.includes('competitive') || lowerMessage.includes('advantage') ||
        lowerMessage.includes('positioning') || lowerMessage.includes('differentiation')) {
      topicScores.strategy = (topicScores.strategy || 0) + 3;
    }
    
    // Marketing-related keywords
    if (lowerMessage.includes('marketing') || lowerMessage.includes('advertising') ||
        lowerMessage.includes('brand') || lowerMessage.includes('customer') ||
        lowerMessage.includes('campaign') || lowerMessage.includes('engagement')) {
      topicScores.marketing = (topicScores.marketing || 0) + 3;
    }
    
    // Technology-related keywords
    if (lowerMessage.includes('technology') || lowerMessage.includes('tech') ||
        lowerMessage.includes('digital') || lowerMessage.includes('ai') ||
        lowerMessage.includes('automation') || lowerMessage.includes('innovation')) {
      topicScores.technology = (topicScores.technology || 0) + 2;
    }
    
    // Leadership-related keywords
    if (lowerMessage.includes('leadership') || lowerMessage.includes('leader') ||
        lowerMessage.includes('management') || lowerMessage.includes('team') ||
        lowerMessage.includes('culture') || lowerMessage.includes('change')) {
      topicScores.leadership = (topicScores.leadership || 0) + 2;
    }
    
    // Business-related keywords
    if (lowerMessage.includes('business') || lowerMessage.includes('company') ||
        lowerMessage.includes('organization') || lowerMessage.includes('growth') ||
        lowerMessage.includes('revenue') || lowerMessage.includes('profit')) {
      topicScores.business = (topicScores.business || 0) + 1;
    }
    
    // Digital transformation keywords
    if (lowerMessage.includes('transformation') || lowerMessage.includes('digital transformation') ||
        lowerMessage.includes('change management') || lowerMessage.includes('agile') ||
        lowerMessage.includes('modernization')) {
      topicScores.digital_transformation = (topicScores.digital_transformation || 0) + 2;
    }

    // Return the topic with the highest score
    const sortedTopics = Object.entries(topicScores)
      .sort(([,a], [,b]) => b - a);
    
    return sortedTopics.length > 0 ? sortedTopics[0][0] : null;
  }

  getStrategicContext(topic) {
    if (!topic || !this.primitives[topic]) {
      return null;
    }

    const primitive = this.primitives[topic];
    return {
      core_principle: primitive.core_principle,
      key_frameworks: primitive.key_frameworks,
      response_pattern: primitive.response_pattern
    };
  }

  injectStrategicFramework(message, topic) {
    const context = this.getStrategicContext(topic);
    if (!context) {
      return message;
    }

    const strategicPrompt = `
IMPORTANT STRATEGIC CONTEXT:
Core Principle: ${context.core_principle}
Key Frameworks: ${context.key_frameworks.join(', ')}
Response Pattern: ${context.response_pattern}

When responding to the user's question, always center your answer around the core principle and incorporate the key frameworks. Make sure your response follows the specified pattern.

User Question: ${message}
`;

    return strategicPrompt;
  }

  enhanceSystemPrompt(basePrompt, topic) {
    const context = this.getStrategicContext(topic);
    if (!context) {
      return basePrompt;
    }

    return `${basePrompt}

STRATEGIC FRAMEWORK INJECTION:
You are responding to a question about ${topic}. Always center your response around: "${context.core_principle}"

Key frameworks to incorporate:
${context.key_frameworks.map(framework => `- ${framework}`).join('\n')}

Response pattern: ${context.response_pattern}

Ensure every part of your response connects back to creating or sustaining competitive advantage in the future.`;
  }
}

export { StrategicPrimitivesAnalyzer };
