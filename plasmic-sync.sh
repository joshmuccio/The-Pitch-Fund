#!/bin/bash

# 🎨 Plasmic Sync Helper Script for The Pitch Fund
# This script pulls the latest designs from Plasmic Studio into your local codebase

set -e  # Exit on any error

echo "🎨 Starting Plasmic sync for The Pitch Fund..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we're in the right directory
if [ ! -f "plasmic.json" ]; then
    echo "❌ Error: plasmic.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if Plasmic CLI is installed
if ! command -v plasmic &> /dev/null; then
    echo "❌ Error: Plasmic CLI not found. Installing..."
    npm install -g @plasmicapp/cli
fi

# Update Plasmic dependencies (recommended for CI/CD)
echo "📦 Updating Plasmic dependencies..."
npm update @plasmicapp/cli @plasmicapp/react-web

# Sync the latest designs
echo "⬇️  Syncing latest designs from Plasmic Studio..."
plasmic sync --yes --force

# Check if sync was successful
if [ $? -eq 0 ]; then
    echo "✅ Plasmic sync completed successfully!"
    echo ""
    echo "🔄 Your local components are now up to date with Plasmic Studio."
    echo "💡 Tip: Your dev server should automatically reload if running."
    echo ""
    echo "📁 Generated files are in:"
    echo "   - src/components/plasmic/"
    echo "   - plasmic-loader/ (if using loader mode)"
    echo ""
    echo "🚀 Ready to continue development!"
else
    echo "❌ Plasmic sync failed. Check the error messages above."
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Sync complete! Happy coding with Plasmic + Next.js!"