#!/bin/bash
# Git hooks installation script for NPM packages
# Installs pre-push hook for code style validation

set -e

HOOKS_DIR=".githooks"
GIT_HOOKS_DIR=".git/hooks"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "⚠️  Not in a git repository, skipping hooks installation"
    exit 0
fi

# Check if hooks directory exists
if [ ! -d "$HOOKS_DIR" ]; then
    echo "⚠️  No $HOOKS_DIR directory found, skipping hooks installation"
    exit 0
fi

echo "🔧 Installing git hooks..."

# Create git hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Copy pre-push hook
if [ -f "$HOOKS_DIR/pre-push" ]; then
    cp "$HOOKS_DIR/pre-push" "$GIT_HOOKS_DIR/pre-push"
    chmod +x "$GIT_HOOKS_DIR/pre-push"
    echo "✅ Installed pre-push hook"
else
    echo "⚠️  No pre-push hook found in $HOOKS_DIR"
fi

echo "🎉 Git hooks installation completed"