import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';

export class StyleTransformer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.modelCachePath = process.env.MODEL_CACHE_PATH || './models';
    this.styleProfile = null;
    
    this.loadStyleProfile();
  }

  async loadStyleProfile() {
    try {
      const profilePath = path.join(this.modelCachePath, 'rishad_style_profile.json');
      if (await fs.pathExists(profilePath)) {
        this.styleProfile = await fs.readJson(profilePath);
      } else {
        this.styleProfile = this.getDefaultStyleProfile();
      }
    } catch (error) {
      console.error('Error loading style profile:', error);
      this.styleProfile = this.getDefaultStyleProfile();
    }
  }

  getDefaultStyleProfile() {
    return {
      writing_style: {
        tone: "insightful, forward-thinking, and provocative",
        voice: "thought leader with deep industry expertise",
        key_themes: [
          "digital transformation",
          "customer-centricity", 
          "data-driven marketing",
          "future of advertising",
          "brand building",
          "technology disruption"
        ],
        characteristic_phrases: [
          "The reality is...",
          "Here's what's happening...",
          "The truth about...",
          "What most people miss...",
          "The future belongs to...",
          "We're seeing a fundamental shift..."
        ],
        writing_patterns: {
          sentence_structure: "Mix of short punchy sentences and longer analytical ones",
          paragraph_style: "Clear topic sentences followed by supporting evidence",
          conclusion_style: "Actionable insights and forward-looking statements"
        }
      }
    };
  }

  async transformContent(content, preserveMeaning = true) {
    const prompt = this.buildTransformationPrompt(content, preserveMeaning);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are transforming content to match Rishad Tobaccowala's writing style. Maintain the core message while adopting his tone, voice, and characteristic patterns.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error transforming content:', error);
      return `Transformation Error: ${error.message}`;
    }
  }

  buildTransformationPrompt(content, preserveMeaning) {
    const styleContext = JSON.stringify(this.styleProfile.writing_style, null, 2);
    
    return `Transform the following content to match Rishad Tobaccowala's writing style:

Rishad's Style Profile:
${styleContext}

Original Content:
"${content}"

Transformation Requirements:
${preserveMeaning ? 
  '1. Preserve the original meaning and key points' : 
  '1. You may adapt the meaning to better fit Rishad\'s perspective'
}
2. Adopt Rishad's tone: ${this.styleProfile.writing_style.tone}
3. Use his characteristic voice: ${this.styleProfile.writing_style.voice}
4. Incorporate his typical themes and perspectives where relevant
5. Use his characteristic phrases and writing patterns
6. Maintain his forward-thinking and insightful approach
7. Add his typical actionable insights and conclusions

Transformed Content:`;
  }

  async transformMultipleFormats(content, formats = ['blog_post', 'tweet', 'presentation']) {
    const results = {};
    
    for (const format of formats) {
      try {
        const transformed = await this.transformToFormat(content, format);
        results[format] = transformed;
      } catch (error) {
        results[format] = `Error transforming to ${format}: ${error.message}`;
      }
    }
    
    return results;
  }

  async transformToFormat(content, format) {
    const formatPrompts = {
      blog_post: "Transform this into a blog post in Rishad's style with clear sections, insights, and actionable takeaways.",
      tweet: "Transform this into a series of 2-3 tweets in Rishad's style, each under 280 characters, with his characteristic insights.",
      presentation: "Transform this into presentation bullet points in Rishad's style, with clear key messages and supporting points.",
      email: "Transform this into a professional email in Rishad's style, with his characteristic tone and insights.",
      interview: "Transform this into interview responses in Rishad's style, with his typical depth and forward-thinking perspective."
    };

    const formatPrompt = formatPrompts[format] || formatPrompts.blog_post;
    const fullPrompt = this.buildTransformationPrompt(content, true) + `\n\nFormat: ${formatPrompt}`;
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are transforming content to match Rishad Tobaccowala's writing style in the specified format.`
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error(`Error transforming to ${format}:`, error);
      return `Transformation Error: ${error.message}`;
    }
  }

  async analyzeStyleDifferences(originalContent, transformedContent) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze the differences between the original and transformed content, focusing on style changes.`
          },
          {
            role: 'user',
            content: `Compare these two versions and identify the key style transformations:

Original:
"${originalContent}"

Transformed:
"${transformedContent}"

Please identify:
1. Tone changes
2. Voice adaptations
3. Structural modifications
4. Added Rishad-style elements
5. Preserved core messages

Analysis:`
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing style differences:', error);
      return `Analysis Error: ${error.message}`;
    }
  }

  async suggestImprovements(content) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Suggest improvements to make content more aligned with Rishad Tobaccowala's style.`
          },
          {
            role: 'user',
            content: `Suggest specific improvements to make this content more like Rishad's style:

"${content}"

Please provide:
1. Specific phrase suggestions
2. Tone adjustments
3. Structural improvements
4. Additional insights to add
5. Rishad-style conclusions

Suggestions:`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      return `Suggestion Error: ${error.message}`;
    }
  }
} 