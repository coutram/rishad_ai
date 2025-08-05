#!/usr/bin/env node

// Test script for streaming functionality
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testStreaming() {
    console.log('🧪 Testing Rishad AI Streaming Response...\n');
    
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: "Hello! Can you tell me about the future of AI?",
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('✅ Streaming response received. Content:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            
            // Print each character as it comes
            process.stdout.write(chunk);
            
            // Small delay to simulate typing effect
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Streaming test completed successfully!');
        console.log(`📝 Total response length: ${fullResponse.length} characters`);

    } catch (error) {
        console.error('❌ Streaming test failed:', error.message);
        console.log('\n💡 Make sure the server is running with: npm run dev');
    }
}

// Run the test
testStreaming(); 