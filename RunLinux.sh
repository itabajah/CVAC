#!/bin/bash
# CV As Code - macOS/Linux Launcher
# Run this script to start. Close browser tab or press Ctrl+C to stop.

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERROR] Node.js is not installed. Please install it from https://nodejs.org"
    echo ""
    exit 1
fi

# Run the cross-platform launcher
cd "$(dirname "$0")"
node src/launcher/index.js
