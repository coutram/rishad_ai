import OpenAI from 'openai';

export class ContentAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeContent(content, analysisType = 'general') {
    const prompt = this.buildAnalysisPrompt(content, analysisType);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a content analysis expert. Provide comprehensive analysis of the given content.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing content:', error);
      return `Analysis Error: ${error.message}`;
    }
  }

  buildAnalysisPrompt(content, analysisType) {
    const analysisTypes = {
      general: 'Provide a general analysis including key themes, tone, and main points.',
      marketing: 'Analyze from a marketing perspective, including target audience, messaging effectiveness, and brand alignment.',
      business: 'Analyze from a business perspective, including strategic implications, market positioning, and competitive analysis.',
      technology: 'Analyze from a technology perspective, including technical implications, innovation potential, and future trends.'
    };

    const analysisFocus = analysisTypes[analysisType] || analysisTypes.general;

    return `Analyze the following content:

Content:
"${content}"

Analysis Type: ${analysisType}

Please provide:
1. ${analysisFocus}
2. Key insights and observations
3. Potential improvements or recommendations
4. Overall assessment

Analysis:`;
  }

  async extractKeyInsights(content) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract key insights and main points from the given content.`
          },
          {
            role: 'user',
            content: `Extract the key insights from this content:

"${content}"

Please provide:
1. Main themes and topics
2. Key insights and takeaways
3. Important data points or statistics
4. Actionable recommendations
5. Critical observations

Key Insights:`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error extracting insights:', error);
      return `Insight Extraction Error: ${error.message}`;
    }
  }

  async identifyToneAndStyle(content) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze the tone and writing style of the given content.`
          },
          {
            role: 'user',
            content: `Analyze the tone and writing style of this content:

"${content}"

Please identify:
1. Overall tone (formal, casual, authoritative, etc.)
2. Writing style characteristics
3. Voice and personality
4. Sentence structure patterns
5. Vocabulary choices
6. Rhetorical devices used
7. Target audience indicators

Tone and Style Analysis:`
          }
        ],
        temperature: 0.4,
        max_tokens: 600
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error identifying tone and style:', error);
      return `Tone Analysis Error: ${error.message}`;
    }
  }

  async compareContent(content1, content2) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Compare two pieces of content and identify similarities and differences.`
          },
          {
            role: 'user',
            content: `Compare these two pieces of content:

Content 1:
"${content1}"

Content 2:
"${content2}"

Please analyze:
1. Similarities in themes and topics
2. Differences in approach and perspective
3. Tone and style comparisons
4. Effectiveness of each piece
5. Target audience differences
6. Key insights from each
7. Overall assessment

Comparison Analysis:`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error comparing content:', error);
      return `Comparison Error: ${error.message}`;
    }
  }

  async suggestImprovements(content, improvementType = 'general') {
    const improvementTypes = {
      general: 'Suggest general improvements for clarity, impact, and effectiveness.',
      marketing: 'Suggest marketing-focused improvements for better audience engagement and conversion.',
      business: 'Suggest business-focused improvements for strategic impact and professional presentation.',
      technical: 'Suggest technical improvements for accuracy, precision, and technical clarity.'
    };

    const improvementFocus = improvementTypes[improvementType] || improvementTypes.general;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Suggest specific improvements for the given content.`
          },
          {
            role: 'user',
            content: `Suggest improvements for this content:

"${content}"

Improvement Type: ${improvementType}

Please provide:
1. ${improvementFocus}
2. Specific suggestions with examples
3. Structural improvements
4. Content enhancements
5. Style and tone adjustments
6. Actionable recommendations

Improvement Suggestions:`
          }
        ],
        temperature: 0.6,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      return `Improvement Suggestion Error: ${error.message}`;
    }
  }
} 