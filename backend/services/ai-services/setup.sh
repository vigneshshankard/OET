#!/bin/bash

# AI Services Installation Script

set -e

echo "🚀 Setting up OET AI Services..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the ai-services directory"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

# Create temp directory
echo "📁 Creating temp directory..."
mkdir -p /tmp/ai-processing

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before starting the service"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ AI Services setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Hugging Face and LiveKit API keys"
echo "2. Run 'npm run dev' for development"
echo "3. Run 'npm start' for production"
echo ""
echo "📖 See README.md for detailed instructions"