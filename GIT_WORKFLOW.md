# Git Branching Workflow Guide

## ⚠️ IMPORTANT: Never Commit Directly to Main

Always use feature branches for development work. Main branch should only receive completed, tested features via pull requests.

## Branch Naming Conventions

### Feature Development:
```bash
feature/description-of-feature
feature/world-source-switching
feature/addon-synchronization
```

### Bug Fixes:
```bash
fix/description-of-bug
fix/world-loading-error
fix/missing-addon-icons
```

### Experiments/Prototypes:
```bash
experiment/description
experiment/new-ui-layout
experiment/performance-optimization
```

## Development Workflow

### 1. Before Starting Any Work:
```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create and switch to a new feature branch
git checkout -b feature/your-feature-name
```

### 2. During Development:
```bash
# Make your changes, test them
npm run dev  # Use hot reload for development

# Commit frequently with descriptive messages
git add .
git commit -m "feat: add specific functionality"

# Push branch to remote when ready
git push origin feature/your-feature-name
```

### 3. When Feature is Complete:
```bash
# Make sure all tests pass
npm test

# Push final changes
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# After PR is approved and merged, cleanup:
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

## Quick Commands

### Check Current Branch:
```bash
git branch          # List all branches (* shows current)
git status          # Shows current branch in output
```

### Switch Between Branches:
```bash
git checkout main                    # Switch to main
git checkout feature/branch-name    # Switch to feature branch
git checkout -b feature/new-feature # Create and switch to new branch
```

### Emergency Fix for "Oops, I'm on Main":
```bash
# If you made changes on main but haven't committed:
git stash                           # Save changes temporarily
git checkout -b feature/my-changes  # Create new branch
git stash pop                       # Apply saved changes
# Now commit on the feature branch

# If you already committed to main (but haven't pushed):
git reset --soft HEAD~1            # Undo last commit, keep changes
git checkout -b feature/my-changes  # Create new branch
git commit -m "proper commit message"  # Commit on feature branch
```

## Pre-Commit Checklist

- [ ] Am I on a feature/fix branch (not main)?
- [ ] Do all tests pass? (`npm test`)
- [ ] Does the app build? (`npm run dist`)
- [ ] Is my commit message descriptive?
- [ ] Are only relevant files included?

## Branch Protection

Consider setting up branch protection rules on GitHub:
- Require pull request reviews before merging
- Require status checks to pass (tests)
- Restrict pushes to main branch