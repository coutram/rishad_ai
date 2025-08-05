#!/bin/bash

# Clean Git History Script
# This script removes files that match .gitignore patterns from the entire Git history

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        print_error "Not in a Git repository. Please run this script from the root of your Git repository."
        exit 1
    fi
}

# Function to check if git filter-repo is available
check_filter_repo() {
    if ! command_exists git-filter-repo; then
        print_warning "git-filter-repo is not installed. Installing it..."
        
        if command_exists pip3; then
            pip3 install git-filter-repo
        elif command_exists pip; then
            pip install git-filter-repo
        else
            print_error "Neither pip3 nor pip is available. Please install git-filter-repo manually:"
            echo "pip3 install git-filter-repo"
            exit 1
        fi
    fi
    
    print_success "git-filter-repo is available"
}

# Function to create backup
create_backup() {
    print_status "Creating backup of current repository..."
    
    backup_dir="../rishad-ai-backup-$(date +%Y%m%d-%H%M%S)"
    
    if git clone --mirror . "$backup_dir"; then
        print_success "Backup created at: $backup_dir"
    else
        print_error "Failed to create backup"
        exit 1
    fi
}

# Function to generate paths to remove from .gitignore
generate_paths_to_remove() {
    print_status "Generating list of paths to remove based on .gitignore..."
    
    # Create a temporary file to store paths
    temp_file=$(mktemp)
    
    # Read .gitignore and convert patterns to git filter-repo format
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
        
        # Convert .gitignore patterns to git filter-repo paths
        if [[ "$line" == */ ]]; then
            # Directory pattern
            echo "$line" >> "$temp_file"
        elif [[ "$line" == */* ]]; then
            # File with path
            echo "$line" >> "$temp_file"
        else
            # Simple file pattern
            echo "**/$line" >> "$temp_file"
        fi
    done < .gitignore
    
    echo "$temp_file"
}

# Function to clean git history
clean_history() {
    local paths_file="$1"
    
    print_status "Cleaning Git history..."
    print_warning "This will rewrite the entire Git history!"
    print_warning "Make sure you have a backup and all team members are aware of this change."
    
    echo ""
    echo "Files/directories that will be removed:"
    cat "$paths_file"
    echo ""
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operation cancelled"
        rm -f "$paths_file"
        exit 0
    fi
    
    # Create the git filter-repo command
    local filter_cmd="git filter-repo --invert-paths --paths-from-file '$paths_file'"
    
    print_status "Running: $filter_cmd"
    
    if eval "$filter_cmd"; then
        print_success "Git history cleaned successfully!"
    else
        print_error "Failed to clean Git history"
        rm -f "$paths_file"
        exit 1
    fi
    
    # Clean up temporary file
    rm -f "$paths_file"
}

# Function to show post-cleanup instructions
show_instructions() {
    echo ""
    print_success "🎉 Git history cleanup completed!"
    echo ""
    echo "📋 Next steps:"
    echo ""
    echo "1. Force push the cleaned history to remote:"
    echo "   git push --force-with-lease origin main"
    echo ""
    echo "2. Inform your team members:"
    echo "   - They need to re-clone the repository"
    echo "   - Or run: git fetch origin && git reset --hard origin/main"
    echo ""
    echo "3. Update any CI/CD pipelines that might be affected"
    echo ""
    echo "⚠️  Important notes:"
    echo "- The repository history has been completely rewritten"
    echo "- All commit hashes have changed"
    echo "- Any existing pull requests will need to be recreated"
    echo "- Make sure all team members are aware of this change"
    echo ""
    echo "🔍 To verify the cleanup:"
    echo "   git log --oneline --all"
    echo "   git status"
}

# Function to show what will be removed
preview_removal() {
    local paths_file="$1"
    
    print_status "Preview of files/directories that will be removed:"
    echo ""
    
    if [ -s "$paths_file" ]; then
        echo "Files/directories matching .gitignore patterns:"
        cat "$paths_file"
        echo ""
        
        # Count files that would be affected
        local count=0
        while IFS= read -r pattern; do
            if [ -n "$pattern" ]; then
                local matches=$(git ls-files | grep -E "$pattern" | wc -l)
                if [ "$matches" -gt 0 ]; then
                    echo "Pattern '$pattern' matches $matches files"
                    ((count += matches))
                fi
            fi
        done < "$paths_file"
        
        echo ""
        echo "Total files that would be affected: $count"
    else
        print_warning "No patterns found in .gitignore"
    fi
    
    echo ""
}

# Main function
main() {
    echo "🧹 Git History Cleanup Script"
    echo "=============================="
    echo ""
    
    # Check prerequisites
    check_git_repo
    check_filter_repo
    
    # Create backup
    create_backup
    
    # Generate paths to remove
    paths_file=$(generate_paths_to_remove)
    
    # Show preview
    preview_removal "$paths_file"
    
    # Ask for confirmation
    read -p "Do you want to see a preview of what will be removed? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Files currently tracked by Git that match .gitignore patterns:"
        echo "=============================================================="
        
        while IFS= read -r pattern; do
            if [ -n "$pattern" ]; then
                echo ""
                echo "Pattern: $pattern"
                git ls-files | grep -E "$pattern" | head -10
                local total=$(git ls-files | grep -E "$pattern" | wc -l)
                if [ "$total" -gt 10 ]; then
                    echo "... and $((total - 10)) more files"
                fi
            fi
        done < "$paths_file"
        echo ""
    fi
    
    # Clean history
    clean_history "$paths_file"
    
    # Show instructions
    show_instructions
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "This script removes files that match .gitignore patterns from the entire Git history."
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --preview      Only show what would be removed (dry run)"
        echo ""
        echo "⚠️  WARNING: This will rewrite the entire Git history!"
        echo "   Make sure you have a backup and inform your team."
        echo ""
        echo "Examples:"
        echo "  $0              # Full cleanup"
        echo "  $0 --preview    # Preview only"
        ;;
    --preview)
        check_git_repo
        paths_file=$(generate_paths_to_remove)
        preview_removal "$paths_file"
        rm -f "$paths_file"
        ;;
    *)
        main
        ;;
esac 