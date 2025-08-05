import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RishadStyleAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.modelCachePath = process.env.MODEL_CACHE_PATH || './models';
    this.trainingDataPath = process.env.TRAINING_DATA_PATH || './data/rishad_writings';
    this.styleProfile = null;
    
    this.initializeStyleProfile();
  }

  async initializeStyleProfile() {
    try {
      await fs.ensureDir(this.modelCachePath);
      await fs.ensureDir(this.trainingDataPath);
      
      const profilePath = path.join(this.modelCachePath, 'rishad_style_profile.json');
      
      if (await fs.pathExists(profilePath)) {
        this.styleProfile = await fs.readJson(profilePath);
      } else {
        this.styleProfile = this.getDefaultStyleProfile();
        await this.saveStyleProfile();
      }
    } catch (error) {
      console.error('Error initializing style profile:', error);
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
      },
      expertise_areas: [
        "Marketing and Advertising",
        "Digital Transformation", 
        "Customer Experience",
        "Data and Analytics",
        "Brand Strategy",
        "Technology Trends"
      ],
      training_data_count: 0,
      last_updated: new Date().toISOString()
    };
  }

  async saveStyleProfile() {
    const profilePath = path.join(this.modelCachePath, 'rishad_style_profile.json');
    await fs.writeJson(profilePath, this.styleProfile, { spaces: 2 });
  }

  async analyzeContent(content, analysisType = 'general') {
    const prompt = this.buildAnalysisPrompt(content, analysisType);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are analyzing content from the perspective of Rishad Tobaccowala, a legendary advertising and marketing thought leader. Apply his insights, style, and expertise to provide analysis.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing content:', error);
      return `Analysis Error: ${error.message}`;
    }
  }

  buildAnalysisPrompt(content, analysisType) {
    const styleContext = JSON.stringify(this.styleProfile.writing_style, null, 2);
    
    return `Based on Rishad Tobaccowala's writing style and expertise, analyze the following content:

Rishad's Style Profile:
${styleContext}

Content to Analyze:
"${content}"

Analysis Type: ${analysisType}

Please provide an analysis that:
1. Applies Rishad's perspective and insights
2. Uses his characteristic tone and voice
3. Draws from his expertise areas
4. Provides actionable insights
5. Maintains his forward-thinking approach

Analysis:`;
  }

  async getInsights(topic, context = '') {
    const prompt = this.buildInsightsPrompt(topic, context);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Rishad Tobaccowala, providing insights and analysis on the given topic. Use his characteristic style, expertise, and forward-thinking perspective.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1200
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error getting insights:', error);
      return `Insights Error: ${error.message}`;
    }
  }

  buildInsightsPrompt(topic, context) {
    const styleContext = JSON.stringify(this.styleProfile.writing_style, null, 2);
    
    return `As Rishad Tobaccowala, provide insights on: "${topic}"

${context ? `Context: ${context}\n` : ''}

Rishad's Style Profile:
${styleContext}

Please provide insights that:
1. Reflect Rishad's deep industry knowledge
2. Use his characteristic writing style
3. Include his typical themes and perspectives
4. Offer forward-thinking analysis
5. Provide actionable takeaways

Insights:`;
  }

  async trainOnContent(content, source) {
    try {
      console.log(`Training on content from: ${source}`);
      
      // Extract content weight from the content if available
      const weightMatch = content.match(/Content Weight: ([\d.]+)/);
      const contentWeight = weightMatch ? parseFloat(weightMatch[1]) : 1.0; // Default to 1.0 if no weight found
      
      // Extract edition number if available
      const editionMatch = content.match(/Edition: (\d+)/);
      const edition = editionMatch ? parseInt(editionMatch[1]) : null;
      
      // Clean the content (remove metadata)
      const cleanContent = content.replace(/Title:.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n---\n.*/s, '').trim();
      
      // Store training data with weight
      const trainingData = {
        content: cleanContent,
        source,
        weight: contentWeight,
        edition,
        timestamp: new Date().toISOString()
      };
      
      // Load existing training data
      const trainingDataPath = path.join(this.trainingDataPath, 'training_data.json');
      let trainingDataArray = [];
      
      try {
        if (await fs.pathExists(trainingDataPath)) {
          const existingData = await fs.readFile(trainingDataPath, 'utf8');
          trainingDataArray = JSON.parse(existingData);
        }
      } catch (error) {
        console.warn('Could not load existing training data, starting fresh');
      }
      
      // Add new training data
      trainingDataArray.push(trainingData);
      
      // Save updated training data
      await fs.writeFile(trainingDataPath, JSON.stringify(trainingDataArray, null, 2));
      
      // Update style profile with weighted influence
      await this.updateStyleProfile(cleanContent, contentWeight);
      
      return {
        success: true,
        source,
        weight: contentWeight,
        edition,
        contentLength: cleanContent.length
      };
      
    } catch (error) {
      console.error('Error training on content:', error);
      return { success: false, error: error.message };
    }
  }

  async updateStyleProfile(content, weight = 1.0) {
    try {
      const profilePath = path.join(this.modelCachePath, 'rishad_style_profile.json');
      let profile = this.styleProfile; // Use this.styleProfile directly
      
      // Load existing profile if it exists
      try {
        if (await fs.pathExists(profilePath)) {
          const existingProfile = await fs.readFile(profilePath, 'utf8');
          profile = JSON.parse(existingProfile);
        }
      } catch (error) {
        console.warn('Could not load existing style profile, using default');
      }
      
      // Analyze content with weighted influence
      const analysis = await this.analyzeContent(content, 'general');
      
      // Update profile with weighted influence
      // More recent content (higher weight) has more influence on the profile
      const influenceFactor = weight;
      
      // Update key themes with weighted influence
      if (analysis.themes) {
        profile.writing_style.key_themes = this.mergeWithWeight(profile.writing_style.key_themes, analysis.themes, influenceFactor);
      }
      
      // Update characteristic phrases with weighted influence
      if (analysis.characteristic_phrases) {
        profile.writing_style.characteristic_phrases = this.mergeWithWeight(profile.writing_style.characteristic_phrases, analysis.characteristic_phrases, influenceFactor);
      }
      
      // Update writing patterns with weighted influence
      if (analysis.writing_patterns) {
        profile.writing_style.writing_patterns = this.mergeWithWeight(profile.writing_style.writing_patterns, analysis.writing_patterns, influenceFactor);
      }
      
      // Update expertise areas with weighted influence
      if (analysis.expertise_areas) {
        profile.expertise_areas = this.mergeWithWeight(profile.expertise_areas, analysis.expertise_areas, influenceFactor);
      }
      
      // Update last modified timestamp
      profile.last_updated = new Date().toISOString();
      profile.training_data_count = (profile.training_data_count || 0) + 1;
      profile.average_content_weight = this.calculateAverageWeight(profile.average_content_weight, weight, profile.training_data_count);
      
      // Save updated profile
      await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));
      
      console.log(`Style profile updated with weight ${weight}`);
      
    } catch (error) {
      console.error('Error updating style profile:', error);
    }
  }

  mergeWithWeight(existing, newItems, weight) {
    if (!existing) return newItems;
    if (!newItems) return existing;
    
    // Create a weighted merge where newer content has more influence
    const merged = [...existing];
    
    for (const newItem of newItems) {
      const existingIndex = merged.findIndex(item => 
        item.toLowerCase().includes(newItem.toLowerCase()) || 
        newItem.toLowerCase().includes(item.toLowerCase())
      );
      
      if (existingIndex >= 0) {
        // If item exists, give more weight to the newer content
        if (weight > 0.8) {
          merged[existingIndex] = newItem; // Replace with newer content
        }
        // If weight is lower, keep existing content
      } else {
        // Add new item
        merged.push(newItem);
      }
    }
    
    // Limit to top items to prevent profile from growing too large
    return merged.slice(0, 20);
  }

  calculateAverageWeight(currentAvg, newWeight, totalEntries) {
    if (!currentAvg) return newWeight;
    return ((currentAvg * (totalEntries - 1)) + newWeight) / totalEntries;
  }

  async getTrainingData() {
    try {
      const files = await fs.readdir(this.trainingDataPath);
      const trainingData = [];
      
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const content = await fs.readFile(path.join(this.trainingDataPath, file), 'utf-8');
          trainingData.push({
            filename: file,
            content: content
          });
        }
      }
      
      return trainingData;
    } catch (error) {
      console.error('Error reading training data:', error);
      return [];
    }
  }
} 