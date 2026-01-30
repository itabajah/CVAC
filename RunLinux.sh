#!/bin/bash
# CV As Code - macOS/Linux Launcher
# Run this script to start. Close browser tab or press Ctrl+C to stop.

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERROR] Node.js is not installed."
    echo ""
    echo "Would you like to install Node.js automatically?"
    echo ""
    read -p "Press Y to install automatically, or any other key to exit: " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "[INFO] Detecting package manager..."
        
        # Detect OS and install accordingly
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - use Homebrew
            if command -v brew &> /dev/null; then
                echo "[INFO] Installing Node.js via Homebrew..."
                brew install node
            else
                echo "[ERROR] Homebrew not found. Please install Homebrew first:"
                echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                echo ""
                echo "Then run this script again."
                exit 1
            fi
        elif command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            echo "[INFO] Installing Node.js via apt..."
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v dnf &> /dev/null; then
            # Fedora
            echo "[INFO] Installing Node.js via dnf..."
            sudo dnf install -y nodejs
        elif command -v pacman &> /dev/null; then
            # Arch Linux
            echo "[INFO] Installing Node.js via pacman..."
            sudo pacman -S nodejs npm
        else
            echo "[ERROR] Could not detect package manager."
            echo "[INFO] Please install Node.js manually from https://nodejs.org"
            exit 1
        fi
        
        # Verify installation
        if command -v node &> /dev/null; then
            echo ""
            echo "[SUCCESS] Node.js installed successfully!"
            echo "[INFO] Continuing with CV As Code..."
            echo ""
        else
            echo ""
            echo "[ERROR] Installation may have failed. Please install Node.js manually."
            exit 1
        fi
    else
        echo ""
        echo "[INFO] Installation cancelled. Please install Node.js manually from https://nodejs.org"
        echo ""
        exit 1
    fi
fi

# Run the cross-platform launcher
cd "$(dirname "$0")"
node src/launcher/index.js
