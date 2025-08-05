#!/bin/bash

# Preview Git History Cleanup
# Shows what files would be removed without actually doing the cleanup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a Git repository. Please run this script from the root of your Git repository."
    exit 1
fi

echo "🔍 Git History Cleanup Preview"
echo "=============================="
echo ""

print_status "This is a preview only - no changes will be made to your repository"
echo ""

# Read patterns from .gitignore
print_status "Reading patterns from .gitignore..."
echo ""

patterns=()
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace
    line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    # Skip empty lines after trimming
    if [[ -z "$line" ]]; then
        continue
    fi
    
    patterns+=("$line")
done < .gitignore

if [ ${#patterns[@]} -eq 0 ]; then
    print_warning "No patterns found in .gitignore"
    exit 0
fi

echo "Patterns from .gitignore:"
printf '%s\n' "${patterns[@]}"
echo ""

# Check which files match these patterns
print_status "Checking which files in Git history match these patterns..."
echo ""

total_files=0
total_size=0
matched_patterns=0

for pattern in "${patterns[@]}"; do
    # Convert .gitignore pattern to grep pattern
    grep_pattern="$pattern"
    
    # Handle directory patterns
    if [[ "$pattern" == */ ]]; then
        grep_pattern="${pattern%/}"
    fi
    
    # Handle wildcards
    grep_pattern=$(echo "$grep_pattern" | sed 's/\./\\./g' | sed 's/\*/.*/g')
    
    # Find matching files
    matching_files=$(git ls-files | grep -E "$grep_pattern" 2>/dev/null || true)
    
    if [ -n "$matching_files" ]; then
        file_count=$(echo "$matching_files" | wc -l)
        total_files=$((total_files + file_count))
        matched_patterns=$((matched_patterns + 1))
        
        echo "Pattern: $pattern"
        echo "  Matches: $file_count files"
        
        # Show first few files
        echo "$matching_files" | head -5 | while read -r file; do
            size=$(git cat-file -s "HEAD:$file" 2>/dev/null || echo "0")
            total_size=$((total_size + size))
            echo "    - $file ($size bytes)"
        done
        
        if [ "$file_count" -gt 5 ]; then
            echo "    ... and $((file_count - 5)) more files"
        fi
        echo ""
    fi
done

echo "================================"
echo "Summary:"
echo "================================"
echo "Patterns checked: ${#patterns[@]}"
echo "Patterns with matches: $matched_patterns"
echo "Total files that would be removed: $total_files"
echo "Estimated size reduction: $((total_size / 1024)) KB"
echo ""

if [ $total_files -eq 0 ]; then
    print_success "No files matching .gitignore patterns found in Git history!"
    echo "Your repository is already clean."
else
    print_warning "Found $total_files files that would be removed from Git history"
    echo ""
    echo "To actually remove these files from Git history, run:"
    echo "  ./clean-git-history.sh"
    echo "  or"
    echo "  ./clean-git-history-simple.sh"
    echo ""
    echo "⚠️  WARNING: This will rewrite the entire Git history!"
    echo "   Make sure you have a backup and inform your team."
fi

echo ""
echo "🔍 To see all matching files in detail:"
echo "  git ls-files | grep -E 'pattern'"
echo ""
echo "📊 To check repository size:"
echo "  git count-objects -vH" 