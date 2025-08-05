#!/bin/bash

# Simple Git History Cleanup Script
# Uses git filter-branch to remove files matching .gitignore patterns

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

echo "🧹 Simple Git History Cleanup"
echo "=============================="
echo ""

print_warning "This script will remove files matching .gitignore patterns from Git history"
print_warning "This will rewrite the entire Git history!"
echo ""

# Create backup
print_status "Creating backup..."
backup_dir="../rishad-ai-backup-$(date +%Y%m%d-%H%M%S)"
if git clone --mirror . "$backup_dir"; then
    print_success "Backup created at: $backup_dir"
else
    print_error "Failed to create backup"
    exit 1
fi

echo ""

# Show what will be removed
print_status "Files currently tracked that match .gitignore patterns:"
echo ""

# Common patterns to remove
patterns=(
    "node_modules"
    ".env"
    ".env.local"
    ".env.development.local"
    ".env.test.local"
    ".env.production.local"
    "npm-debug.log*"
    "yarn-debug.log*"
    "yarn-error.log*"
    "*.pid"
    "*.seed"
    "*.pid.lock"
    "coverage"
    "*.lcov"
    ".nyc_output"
    ".npm"
    ".eslintcache"
    ".cache"
    ".parcel-cache"
    ".next"
    ".nuxt"
    "tmp"
    "temp"
    ".vscode"
    ".idea"
    "*.swp"
    "*.swo"
    "*~"
    ".DS_Store"
    ".DS_Store?"
    "._*"
    ".Spotlight-V100"
    ".Trashes"
    "ehthumbs.db"
    "Thumbs.db"
    ".vercel"
    "*.tsbuildinfo"
)

total_files=0
for pattern in "${patterns[@]}"; do
    files=$(git ls-files | grep -E "$pattern" | wc -l)
    if [ "$files" -gt 0 ]; then
        echo "Pattern '$pattern' matches $files files"
        total_files=$((total_files + files))
    fi
done

echo ""
echo "Total files that would be affected: $total_files"
echo ""

if [ $total_files -eq 0 ]; then
    print_success "No files matching .gitignore patterns found in Git history!"
    exit 0
fi

# Ask for confirmation
read -p "Do you want to continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Operation cancelled"
    exit 0
fi

echo ""

# Create a script for git filter-branch
filter_script=$(mktemp)
cat > "$filter_script" << 'EOF'
#!/bin/bash
# Remove files matching .gitignore patterns

# Remove common patterns
git rm -rf --cached --ignore-unmatch \
    node_modules/ \
    .env \
    .env.local \
    .env.development.local \
    .env.test.local \
    .env.production.local \
    npm-debug.log* \
    yarn-debug.log* \
    yarn-error.log* \
    *.pid \
    *.seed \
    *.pid.lock \
    coverage/ \
    *.lcov \
    .nyc_output/ \
    .npm/ \
    .eslintcache \
    .cache/ \
    .parcel-cache/ \
    .next/ \
    .nuxt/ \
    tmp/ \
    temp/ \
    .vscode/ \
    .idea/ \
    *.swp \
    *.swo \
    *~ \
    .DS_Store \
    .DS_Store? \
    ._* \
    .Spotlight-V100 \
    .Trashes \
    ehthumbs.db \
    Thumbs.db \
    .vercel/ \
    *.tsbuildinfo \
    2>/dev/null || true
EOF

chmod +x "$filter_script"

print_status "Running git filter-branch..."
print_warning "This may take a while depending on repository size..."

if git filter-branch --force --index-filter "$filter_script" --prune-empty --tag-name-filter cat -- --all; then
    print_success "Git history cleaned successfully!"
else
    print_error "Failed to clean Git history"
    rm -f "$filter_script"
    exit 1
fi

# Clean up
rm -f "$filter_script"

# Remove backup refs
print_status "Cleaning up backup references..."
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d 2>/dev/null || true

# Garbage collect
print_status "Running garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

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