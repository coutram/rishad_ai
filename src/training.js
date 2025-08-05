import fs from 'fs-extra';
import path from 'path';
import { RishadStyleAnalyzer } from './rishad-analyzer.js';
import dotenv from 'dotenv';

dotenv.config();

class RishadTrainer {
  constructor() {
    this.analyzer = new RishadStyleAnalyzer();
    this.trainingDataPath = process.env.TRAINING_DATA_PATH || './data/rishad_writings';
  }

  async trainFromFile(filePath, source) {
    try {
      console.log(`Training from file: ${filePath}`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const result = await this.analyzer.trainOnContent(content, source);
      
      console.log(`✅ Successfully trained from ${source}`);
      return result;
    } catch (error) {
      console.error(`❌ Error training from ${filePath}:`, error);
      return null;
    }
  }

  async trainFromDirectory(directoryPath) {
    try {
      console.log(`Training from directory: ${directoryPath}`);
      
      const files = await fs.readdir(directoryPath);
      const textFiles = files.filter(file => 
        file.endsWith('.txt') || file.endsWith('.md') || file.endsWith('.json')
      );
      
      console.log(`Found ${textFiles.length} files to train on`);
      
      for (const file of textFiles) {
        const filePath = path.join(directoryPath, file);
        const source = `file: ${file}`;
        await this.trainFromFile(filePath, source);
      }
      
      console.log('✅ Training from directory completed');
    } catch (error) {
      console.error('❌ Error training from directory:', error);
    }
  }

  async trainFromSampleData() {
    const sampleData = [
      {
        content: `The reality is that we're living in a world where the customer is in control. The old advertising model of interrupting people with messages they don't want is dead. The future belongs to those who can create meaningful connections and provide real value to their customers.`,
        source: 'sample_thought_leadership'
      },
      {
        content: `Here's what's happening in marketing today: we're seeing a fundamental shift from brand-centric to customer-centric thinking. What most people miss is that this isn't just about technology - it's about understanding human behavior and creating experiences that matter.`,
        source: 'sample_marketing_insights'
      },
      {
        content: `The truth about digital transformation is that it's not about the technology. It's about changing how you think about your business, your customers, and your value proposition. Companies that focus on the technology without addressing the cultural and strategic shifts will fail.`,
        source: 'sample_digital_transformation'
      },
      {
        content: `We're seeing a fundamental shift in how brands are built and maintained. The future belongs to those who can create authentic connections, leverage data intelligently, and adapt to changing customer expectations. The old rules don't apply anymore.`,
        source: 'sample_brand_building'
      },
      {
        content: `What most people miss about the future of advertising is that it's not about reaching more people - it's about reaching the right people with the right message at the right time. The companies that understand this will win.`,
        source: 'sample_advertising_future'
      }
    ];

    console.log('Training on sample Rishad-style content...');
    
    for (const data of sampleData) {
      await this.analyzer.trainOnContent(data.content, data.source);
      console.log(`✅ Trained on: ${data.source}`);
    }
    
    console.log('✅ Sample training completed');
  }

  async createTrainingDataStructure() {
    const structure = {
      'blog_posts': 'Rishad\'s blog posts and articles',
      'tweets': 'Rishad\'s Twitter/X posts',
      'interviews': 'Interview transcripts and quotes',
      'presentations': 'Presentation content and slides',
      'books': 'Book excerpts and chapters',
      'speeches': 'Speech transcripts',
      'podcasts': 'Podcast transcripts and quotes'
    };

    for (const [folder, description] of Object.entries(structure)) {
      const folderPath = path.join(this.trainingDataPath, folder);
      await fs.ensureDir(folderPath);
      
      const readmePath = path.join(folderPath, 'README.md');
      const readmeContent = `# ${description}

Place ${description.toLowerCase()} in this folder.

Supported formats:
- .txt (plain text)
- .md (markdown)
- .json (structured data)

Each file should contain content from Rishad Tobaccowala that you want the AI to learn from.`;
      
      await fs.writeFile(readmePath, readmeContent);
      console.log(`✅ Created folder: ${folder}`);
    }
  }

  async getTrainingStats() {
    try {
      const trainingData = await this.analyzer.getTrainingData();
      const profile = this.analyzer.styleProfile;
      
      console.log('\n📊 Training Statistics:');
      console.log(`Total training files: ${trainingData.length}`);
      console.log(`Training data count: ${profile.training_data_count}`);
      console.log(`Last updated: ${profile.last_updated}`);
      console.log(`Key themes: ${profile.writing_style.key_themes.length}`);
      console.log(`Characteristic phrases: ${profile.writing_style.characteristic_phrases.length}`);
      
      return {
        files: trainingData.length,
        count: profile.training_data_count,
        lastUpdated: profile.last_updated,
        themes: profile.writing_style.key_themes.length,
        phrases: profile.writing_style.characteristic_phrases.length
      };
    } catch (error) {
      console.error('Error getting training stats:', error);
      return null;
    }
  }

  async interactiveTraining() {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🎓 Rishad AI Training Interface');
    console.log('==============================\n');

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    while (true) {
      console.log('\nOptions:');
      console.log('1. Train from sample data');
      console.log('2. Train from file');
      console.log('3. Train from directory');
      console.log('4. Create training data structure');
      console.log('5. Show training statistics');
      console.log('6. Exit');

      const choice = await question('\nEnter your choice (1-6): ');

      switch (choice) {
        case '1':
          await this.trainFromSampleData();
          break;
        case '2':
          const filePath = await question('Enter file path: ');
          const source = await question('Enter source description: ');
          await this.trainFromFile(filePath, source);
          break;
        case '3':
          const dirPath = await question('Enter directory path: ');
          await this.trainFromDirectory(dirPath);
          break;
        case '4':
          await this.createTrainingDataStructure();
          break;
        case '5':
          await this.getTrainingStats();
          break;
        case '6':
          console.log('Goodbye!');
          rl.close();
          return;
        default:
          console.log('Invalid choice. Please try again.');
      }
    }
  }
}

// CLI interface
async function main() {
  const trainer = new RishadTrainer();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await trainer.interactiveTraining();
  } else {
    const command = args[0];
    
    switch (command) {
      case 'sample':
        await trainer.trainFromSampleData();
        break;
      case 'file':
        if (args.length < 3) {
          console.log('Usage: node training.js file <filepath> <source>');
          return;
        }
        await trainer.trainFromFile(args[1], args[2]);
        break;
      case 'directory':
        if (args.length < 2) {
          console.log('Usage: node training.js directory <directory_path>');
          return;
        }
        await trainer.trainFromDirectory(args[1]);
        break;
      case 'structure':
        await trainer.createTrainingDataStructure();
        break;
      case 'stats':
        await trainer.getTrainingStats();
        break;
      default:
        console.log('Available commands:');
        console.log('  sample - Train on sample data');
        console.log('  file <filepath> <source> - Train from specific file');
        console.log('  directory <path> - Train from directory');
        console.log('  structure - Create training data structure');
        console.log('  stats - Show training statistics');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 