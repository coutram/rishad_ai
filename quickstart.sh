#!/bin/bash

echo "🚀 Rishad AI - Quick Start Setup"
echo "================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo "🔧 Setting up environment variables..."
    cp env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add your OpenAI API key"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p data/rishad_writings
mkdir -p models
mkdir -p public

echo "✅ Directories created"

# Initialize training data structure
echo ""
echo "🎓 Setting up training data structure..."
node src/training.js structure

# Train on sample data
echo ""
echo "🧠 Training on sample data..."
node src/training.js sample

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your OpenAI API key"
echo "2. Start the MCP server: npm start"
echo "3. Start the chatbot: npm run chat"
echo "4. Open http://localhost:3001 in your browser"
echo ""
echo "For more information, see README.md" 