import { HighPriorityTrainer } from './src/high-priority-trainer.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Starting High-Priority Training on Rishad\'s Current Thinking...\n');
  
  try {
    const trainer = new HighPriorityTrainer();
    
    console.log('📚 Loading high-priority content from manuscript...');
    const content = await trainer.loadHighPriorityContent();
    console.log(`✅ Loaded ${content.length} content chunks\n`);
    
    console.log('🎯 Processing and training on high-priority content...');
    const trainingData = await trainer.trainOnHighPriorityContent();
    console.log(`✅ Training completed successfully!\n`);
    
    console.log('📊 Training Summary:');
    console.log(`- Content chunks processed: ${trainingData.length}`);
    console.log(`- Priority level: 10/10 (Maximum)`);
    console.log(`- Weight multiplier: 2.0x`);
    console.log(`- Source: Re-Thinking Work Manuscript`);
    console.log(`- Style profile updated with current thinking`);
    console.log(`- Strategic primitives enhanced`);
    
    console.log('\n🎉 High-priority training complete! Rishad AI will now prioritize his current thinking on the future of work.');
    
  } catch (error) {
    console.error('❌ Training failed:', error);
    process.exit(1);
  }
}

main();
