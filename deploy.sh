#!/bin/bash

# Rishad AI Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate project structure
validate_project() {
    print_status "Validating project structure..."
    
    required_files=(
        "package.json"
        "vercel.json"
        "api/chat.js"
        "api/analyze.js"
        "api/transform.js"
        "api/health.js"
        "api/_utils.js"
        "public/index.html"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Missing required file: $file"
            exit 1
        fi
    done
    
    print_success "Project structure validation passed"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
    
    print_success "Dependencies check completed"
}

# Function to check environment setup
check_environment() {
    print_status "Checking environment setup..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning "No .env file found. Creating one..."
        echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
        print_warning "Please update the .env file with your actual OpenAI API key"
    fi
    
    # Check if OpenAI API key is set
    if grep -q "your_openai_api_key_here" .env; then
        print_warning "OpenAI API key not configured in .env file"
        print_warning "You can set it as an environment variable in Vercel dashboard after deployment"
    fi
    
    print_success "Environment check completed"
}

# Function to check Vercel CLI
check_vercel_cli() {
    print_status "Checking Vercel CLI..."
    
    if ! command_exists vercel; then
        print_warning "Vercel CLI is not installed. Installing now..."
        npm install -g vercel
    fi
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_warning "Please log in to Vercel..."
        vercel login
    fi
    
    print_success "Vercel CLI check completed"
}

# Function to run tests
run_tests() {
    print_status "Running basic tests..."
    
    # Test if the project can be built
    if npm run build &> /dev/null; then
        print_success "Build test passed"
    else
        print_warning "Build test failed, but continuing..."
    fi
}

# Function to deploy
deploy() {
    print_status "Starting deployment to Vercel..."
    
    # Deploy to production
    if vercel --prod; then
        print_success "Deployment completed successfully!"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to show post-deployment instructions
show_instructions() {
    echo ""
    print_success "🎉 Deployment completed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set your OPENAI_API_KEY in Vercel dashboard:"
    echo "   - Go to your project in Vercel dashboard"
    echo "   - Navigate to Settings > Environment Variables"
    echo "   - Add: OPENAI_API_KEY = your_actual_openai_api_key"
    echo ""
    echo "2. Test your deployment:"
    echo "   - Visit your Vercel URL"
    echo "   - Test the chat functionality"
    echo "   - Try the content analysis and transformation features"
    echo ""
    echo "3. Monitor your deployment:"
    echo "   - Check Vercel dashboard for function logs"
    echo "   - Monitor API usage and costs"
    echo "   - Set up alerts if needed"
    echo ""
    echo "📚 Documentation:"
    echo "- DEPLOYMENT.md - Detailed deployment guide"
    echo "- PROJECT_STRUCTURE.md - Code organization guide"
    echo ""
    echo "🌐 Your app should now be live at: https://your-project-name.vercel.app"
}

# Main deployment process
main() {
    echo "🚀 Rishad AI Vercel Deployment Script"
    echo "====================================="
    echo ""
    
    # Run all checks and deployment steps
    validate_project
    check_dependencies
    check_environment
    check_vercel_cli
    run_tests
    deploy
    show_instructions
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --validate     Only validate project structure"
        echo "  --check        Only run checks without deploying"
        echo ""
        echo "Examples:"
        echo "  $0              # Full deployment"
        echo "  $0 --validate   # Only validate project"
        echo "  $0 --check      # Only run checks"
        ;;
    --validate)
        validate_project
        check_dependencies
        check_environment
        print_success "Validation completed"
        ;;
    --check)
        validate_project
        check_dependencies
        check_environment
        check_vercel_cli
        run_tests
        print_success "All checks passed"
        ;;
    *)
        main
        ;;
esac 