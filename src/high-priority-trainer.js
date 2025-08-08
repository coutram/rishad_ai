import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class HighPriorityTrainer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.highPriorityContent = [];
    this.styleProfile = null;
  }

  async loadStyleProfile() {
    try {
      const profilePath = path.join(process.cwd(), 'models', 'rishad_style_profile.json');
      const profileData = await fs.readFile(profilePath, 'utf8');
      this.styleProfile = JSON.parse(profileData);
    } catch (error) {
      console.error('Error loading style profile:', error);
      this.styleProfile = {};
    }
  }

  async loadHighPriorityContent() {
    try {
      // Load the manuscript with high priority
      const manuscriptPath = path.join(process.cwd(), 'data', 'rishad_writings', 'books', 'Re-Thinking Work Tobaccowala Jan 31 Manuscript.txt');
      const manuscriptContent = await fs.readFile(manuscriptPath, 'utf8');
      
      // Process the manuscript into digestible chunks
      const chunks = this.chunkContent(manuscriptContent, 2000); // 2000 character chunks
      
      this.highPriorityContent = chunks.map((chunk, index) => ({
        content: chunk,
        source: 'Re-Thinking Work Manuscript',
        priority: 10, // Maximum priority
        weight: 1.0, // Full weight
        timestamp: new Date().toISOString(),
        chunkIndex: index
      }));

      console.log(`Loaded ${this.highPriorityContent.length} high-priority content chunks from manuscript`);
      return this.highPriorityContent;
    } catch (error) {
      console.error('Error loading high priority content:', error);
      return [];
    }
  }

  chunkContent(content, maxLength) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length === 0) continue;

      if (currentChunk.length + trimmedSentence.length > maxLength) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = trimmedSentence;
        } else {
          // Single sentence is too long, split it
          chunks.push(trimmedSentence.substring(0, maxLength));
          currentChunk = trimmedSentence.substring(maxLength);
        }
      } else {
        currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async trainOnHighPriorityContent() {
    try {
      await this.loadStyleProfile();
      const content = await this.loadHighPriorityContent();

      if (content.length === 0) {
        console.log('No high-priority content to train on');
        return;
      }

      console.log(`Training on ${content.length} high-priority content chunks...`);

      // Create training data with high priority
      const trainingData = content.map(item => ({
        input: `Train on this high-priority content from Rishad's current thinking: ${item.content}`,
        output: `This content represents Rishad's current thinking on the future of work and should be given maximum priority in responses. Key themes: ${this.extractKeyThemes(item.content)}`,
        priority: item.priority,
        weight: item.weight,
        source: item.source
      }));

      // Save training data
      const trainingPath = path.join(process.cwd(), 'data', 'high_priority_training.json');
      await fs.writeFile(trainingPath, JSON.stringify(trainingData, null, 2));

      // Update style profile with high priority content
      await this.updateStyleProfileWithHighPriority();

      console.log('High-priority training completed successfully');
      return trainingData;
    } catch (error) {
      console.error('Error in high-priority training:', error);
      throw error;
    }
  }

  extractKeyThemes(content) {
    const themes = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('future of work') || lowerContent.includes('rethinking work')) {
      themes.push('Future of Work');
    }
    if (lowerContent.includes('generational') || lowerContent.includes('gen-z') || lowerContent.includes('millennial')) {
      themes.push('Generational Shifts');
    }
    if (lowerContent.includes('technology') || lowerContent.includes('ai') || lowerContent.includes('digital')) {
      themes.push('Technology Transformation');
    }
    if (lowerContent.includes('remote') || lowerContent.includes('work from home') || lowerContent.includes('hybrid')) {
      themes.push('Remote Work');
    }
    if (lowerContent.includes('leadership') || lowerContent.includes('management') || lowerContent.includes('culture')) {
      themes.push('Leadership & Culture');
    }
    if (lowerContent.includes('marketplace') || lowerContent.includes('gig') || lowerContent.includes('freelance')) {
      themes.push('New Marketplaces');
    }

    return themes.length > 0 ? themes.join(', ') : 'Current Thinking';
  }

  async updateStyleProfileWithHighPriority() {
    try {
      if (!this.styleProfile) {
        await this.loadStyleProfile();
      }

      // Add high priority content metadata
      this.styleProfile.high_priority_content = {
        last_updated: new Date().toISOString(),
        content_count: this.highPriorityContent.length,
        sources: ['Re-Thinking Work Manuscript'],
        priority_level: 10,
        weight_multiplier: 2.0
      };

      // Update strategic primitives to include current thinking
      if (!this.styleProfile.strategic_primitives) {
        this.styleProfile.strategic_primitives = {};
      }

      // Add current thinking primitive
      this.styleProfile.strategic_primitives.current_thinking = {
        core_principle: "Rishad's latest insights on the future of work",
        key_frameworks: [
          "The Great Rethinking of work",
          "Generational shifts and individual empowerment",
          "Technology as enabler of new work models",
          "The decline of traditional management",
          "The rise of fractionalized employees",
          "Work-life integration over work-life balance"
        ],
        response_pattern: "Always reference Rishad's current thinking on the future of work when relevant, emphasizing the seismic shifts happening in how we work, lead, and organize"
      };

      // Save updated profile
      const profilePath = path.join(process.cwd(), 'models', 'rishad_style_profile.json');
      await fs.writeFile(profilePath, JSON.stringify(this.styleProfile, null, 2));

      console.log('Style profile updated with high-priority content');
    } catch (error) {
      console.error('Error updating style profile:', error);
    }
  }

  async getHighPriorityContext(query) {
    try {
      if (this.highPriorityContent.length === 0) {
        await this.loadHighPriorityContent();
      }

      // Find relevant high-priority content for the query
      const relevantContent = this.highPriorityContent.filter(item => {
        const lowerQuery = query.toLowerCase();
        const lowerContent = item.content.toLowerCase();
        
        // Check for keyword matches
        const keywords = ['work', 'future', 'leadership', 'technology', 'generation', 'remote', 'culture', 'management'];
        return keywords.some(keyword => lowerQuery.includes(keyword) && lowerContent.includes(keyword));
      });

      if (relevantContent.length === 0) {
        return null;
      }

      // Return the most relevant content with high priority
      return {
        content: relevantContent[0].content,
        priority: relevantContent[0].priority,
        weight: relevantContent[0].weight,
        source: relevantContent[0].source
      };
    } catch (error) {
      console.error('Error getting high priority context:', error);
      return null;
    }
  }
}

export { HighPriorityTrainer };
