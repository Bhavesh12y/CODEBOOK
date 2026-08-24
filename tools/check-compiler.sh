#!/usr/bin/env bash
# check-compiler.sh — Linux/macOS compiler detection for CodeBook
# Usage: bash check-compiler.sh [--install]
set -euo pipefail

step() { echo "[CodeBook] $*"; }

OS="$(uname -s)"

# Detect an available C++ compiler
detect_compiler() {
  for cmd in g++ clang++ c++; do
    if command -v "$cmd" &>/dev/null; then
      step "C++ compiler found: $(command -v "$cmd")"
      "$cmd" --version | head -1
      exit 0
    fi
  done
  return 1
}

if detect_compiler; then
  exit 0
fi

step "No C++ compiler (g++, clang++) found on PATH."

if [[ "${1:-}" == "--install" ]]; then
  case "$OS" in
    Linux)
      if command -v apt-get &>/dev/null; then
        step "Installing g++ via apt..."
        sudo apt-get update && sudo apt-get install -y g++
      elif command -v dnf &>/dev/null; then
        step "Installing g++ via dnf..."
        sudo dnf install -y gcc-c++
      elif command -v pacman &>/dev/null; then
        step "Installing g++ via pacman..."
        sudo pacman -S --noconfirm gcc
      else
        step "Could not detect package manager. Install g++ manually."
        exit 2
      fi
      ;;
    Darwin)
      if command -v xcode-select &>/dev/null; then
        step "Installing Xcode Command Line Tools (provides clang++)..."
        xcode-select --install 2>/dev/null || true
        step "If a dialog appeared, complete the installation and re-run CodeBook."
      else
        step "Install Xcode Command Line Tools manually: xcode-select --install"
        exit 2
      fi
      ;;
    *)
      step "Unsupported OS: $OS"
      exit 2
      ;;
  esac

  # Verify after install attempt
  if detect_compiler; then
    exit 0
  fi
  step "Compiler still not found after install attempt. Please install manually and restart CodeBook."
  exit 1
fi

# No --install flag: print guidance
case "$OS" in
  Linux)
    step "Install a C++ compiler with one of:"
    echo "  Ubuntu/Debian: sudo apt install g++"
    echo "  Fedora:        sudo dnf install gcc-c++"
    echo "  Arch:          sudo pacman -S gcc"
    ;;
  Darwin)
    step "Install Xcode Command Line Tools:"
    echo "  xcode-select --install"
    ;;
esac
exit 1
