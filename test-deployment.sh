#!/bin/bash

# Rishad AI Deployment Test Script
# This script tests the deployed application endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Get the deployment URL from command line or use default
DEPLOYMENT_URL="${1:-}"
if [ -z "$DEPLOYMENT_URL" ]; then
    print_warning "No deployment URL provided. Please provide the URL as an argument."
    echo "Usage: $0 <deployment-url>"
    echo "Example: $0 https://rishad-ai.vercel.app"
    exit 1
fi

# Remove trailing slash if present
DEPLOYMENT_URL="${DEPLOYMENT_URL%/}"

echo "🧪 Testing Rishad AI Deployment"
echo "================================"
echo "URL: $DEPLOYMENT_URL"
echo ""

# Test health endpoint
test_health() {
    print_status "Testing health endpoint..."
    
    response=$(curl -s "$DEPLOYMENT_URL/api/health")
    
    if echo "$response" | grep -q '"status":"ok"'; then
        print_success "Health endpoint is working"
        echo "Response: $response"
    else
        print_error "Health endpoint failed"
        echo "Response: $response"
        return 1
    fi
    echo ""
}

# Test chat endpoint
test_chat() {
    print_status "Testing chat endpoint..."
    
    response=$(curl -s -X POST "$DEPLOYMENT_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d '{"message": "Hello, can you tell me about the future of work?"}')
    
    if echo "$response" | grep -q '"response"'; then
        print_success "Chat endpoint is working"
        echo "Response preview: $(echo "$response" | head -c 200)..."
    else
        print_error "Chat endpoint failed"
        echo "Response: $response"
        return 1
    fi
    echo ""
}

# Test analyze endpoint
test_analyze() {
    print_status "Testing analyze endpoint..."
    
    response=$(curl -s -X POST "$DEPLOYMENT_URL/api/analyze" \
        -H "Content-Type: application/json" \
        -d '{"content": "Our company is launching a new digital marketing campaign targeting millennials.", "analysisType": "marketing"}')
    
    if echo "$response" | grep -q '"analysis"'; then
        print_success "Analyze endpoint is working"
        echo "Response preview: $(echo "$response" | head -c 200)..."
    else
        print_error "Analyze endpoint failed"
        echo "Response: $response"
        return 1
    fi
    echo ""
}

# Test transform endpoint
test_transform() {
    print_status "Testing transform endpoint..."
    
    response=$(curl -s -X POST "$DEPLOYMENT_URL/api/transform" \
        -H "Content-Type: application/json" \
        -d '{"content": "We need to improve our customer service.", "preserveMeaning": true, "format": "blog_post"}')
    
    if echo "$response" | grep -q '"transformed"'; then
        print_success "Transform endpoint is working"
        echo "Response preview: $(echo "$response" | head -c 200)..."
    else
        print_error "Transform endpoint failed"
        echo "Response: $response"
        return 1
    fi
    echo ""
}

# Test frontend
test_frontend() {
    print_status "Testing frontend..."
    
    response=$(curl -s "$DEPLOYMENT_URL/")
    
    if echo "$response" | grep -q "Rishad AI"; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend failed to load"
        return 1
    fi
    echo ""
}

# Test CORS
test_cors() {
    print_status "Testing CORS headers..."
    
    response=$(curl -s -I "$DEPLOYMENT_URL/api/health")
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        print_success "CORS headers are properly configured"
    else
        print_warning "CORS headers may not be configured"
    fi
    echo ""
}

# Test error handling
test_error_handling() {
    print_status "Testing error handling..."
    
    # Test invalid method
    response=$(curl -s -X GET "$DEPLOYMENT_URL/api/chat")
    
    if echo "$response" | grep -q '"error"'; then
        print_success "Error handling is working (invalid method)"
    else
        print_warning "Error handling may not be working properly"
    fi
    
    # Test missing required fields
    response=$(curl -s -X POST "$DEPLOYMENT_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$response" | grep -q '"error"'; then
        print_success "Error handling is working (missing fields)"
    else
        print_warning "Error handling may not be working properly"
    fi
    echo ""
}

# Performance test
test_performance() {
    print_status "Testing performance..."
    
    start_time=$(date +%s.%N)
    curl -s "$DEPLOYMENT_URL/api/health" > /dev/null
    end_time=$(date +%s.%N)
    
    response_time=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        print_success "Performance is good (${response_time}s response time)"
    else
        print_warning "Performance may be slow (${response_time}s response time)"
    fi
    echo ""
}

# Main test function
main() {
    local failed_tests=0
    
    echo "Starting tests..."
    echo ""
    
    # Run all tests
    test_health || ((failed_tests++))
    test_chat || ((failed_tests++))
    test_analyze || ((failed_tests++))
    test_transform || ((failed_tests++))
    test_frontend || ((failed_tests++))
    test_cors
    test_error_handling
    test_performance
    
    echo "================================"
    echo "Test Results Summary"
    echo "================================"
    
    if [ $failed_tests -eq 0 ]; then
        print_success "All critical tests passed! 🎉"
        echo ""
        echo "Your Rishad AI deployment is working correctly."
        echo "You can now:"
        echo "1. Share the URL with others"
        echo "2. Set up monitoring and alerts"
        echo "3. Configure custom domains if needed"
    else
        print_error "$failed_tests critical test(s) failed"
        echo ""
        echo "Please check the failed tests above and fix any issues."
        echo "Common issues:"
        echo "- Environment variables not set in Vercel"
        echo "- API endpoints not properly configured"
        echo "- Network connectivity issues"
    fi
    
    echo ""
    echo "Deployment URL: $DEPLOYMENT_URL"
    echo "Vercel Dashboard: https://vercel.com/dashboard"
}

# Check if bc is available for performance testing
if ! command -v bc &> /dev/null; then
    print_warning "bc command not found. Performance testing will be skipped."
    test_performance() {
        print_warning "Performance testing skipped (bc not available)"
        echo ""
    }
fi

# Run the tests
main 