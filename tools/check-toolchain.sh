#!/usr/bin/env bash
# check-toolchain.sh — Multi-language toolchain check & installer for CodeBook
set -euo pipefail

INSTALL=false
LANGUAGE="all"

for arg in "$@"; do
    case "$arg" in
        --install|-i)
            INSTALL=true
            ;;
        --lang=*|--language=*)
            LANGUAGE="${arg#*=}"
            ;;
        cpp|c|python|java)
            LANGUAGE="$arg"
            ;;
    esac
done

OS="$(uname -s)"
step() { echo "[CodeBook] $*"; }

printf "\n=================================================\n"
printf "       CodeBook Multi-Language Toolchain Check   \n"
printf "=================================================\n"
printf "%-15s | %-10s | %s\n" "Language" "Status" "Details"
printf "%-15s | %-10s | %s\n" "--------" "------" "-------"

# 1. C/C++ Compiler
found_cpp=false
for cmd in g++ clang++ gcc clang; do
    if command -v "$cmd" >/dev/null 2>&1; then
        version=$("$cmd" --version 2>&1 | head -n 1)
        printf "%-15s | %-10s | %s\n" "C / C++" "[OK]" "$cmd ($version)"
        found_cpp=true
        break
    fi
done
if [ "$found_cpp" = false ]; then
    printf "%-15s | %-10s | %s\n" "C / C++" "[MISSING]" "g++, clang++, gcc, or clang not found"
fi

# 2. Python
found_py=false
for cmd in python3 python py; do
    if command -v "$cmd" >/dev/null 2>&1; then
        version_str=$("$cmd" --version 2>&1 | head -n 1)
        version=${version_str#Python }
        if [[ $version =~ ^3\.([0-9]+) ]]; then
            minor="${BASH_REMATCH[1]}"
            if [ "$minor" -ge 10 ]; then
                printf "%-15s | %-10s | %s\n" "Python" "[OK]" "$cmd ($version_str)"
                found_py=true
                break
            else
                printf "%-15s | %-10s | %s\n" "Python" "[WARN]" "$cmd ($version_str, >= 3.10 recommended)"
                found_py=true
                break
            fi
        fi
    fi
done
if [ "$found_py" = false ]; then
    printf "%-15s | %-10s | %s\n" "Python" "[MISSING]" "Python 3.10+ not found on PATH"
fi

# 3. Java JDK
found_java=false
if command -v javac >/dev/null 2>&1; then
    version_str=$(javac --version 2>&1 | head -n 1)
    version=${version_str#javac }
    if [[ $version =~ ^([0-9]+) ]]; then
        major=${BASH_REMATCH[1]}
        if [ "$major" -ge 17 ]; then
            printf "%-15s | %-10s | %s\n" "Java (JDK)" "[OK]" "javac ($version_str)"
            found_java=true
        else
            printf "%-15s | %-10s | %s\n" "Java (JDK)" "[WARN]" "javac ($version_str, >= 17 recommended)"
            found_java=true
        fi
    else
        printf "%-15s | %-10s | %s\n" "Java (JDK)" "[OK]" "$version_str"
        found_java=true
    fi
fi
if [ "$found_java" = false ]; then
    printf "%-15s | %-10s | %s\n" "Java (JDK)" "[MISSING]" "javac not found (JDK 17+ recommended)"
fi
printf "=================================================\n\n"

if [ "$found_cpp" = true ] && [ "$found_py" = true ] && [ "$found_java" = true ]; then
    step "All toolchains (C/C++, Python, Java) are installed and ready!"
    exit 0
fi

if [ "$INSTALL" = true ]; then
    case "$OS" in
        Linux)
            if command -v apt-get >/dev/null 2>&1; then
                step "Installing missing packages with apt..."
                sudo apt-get update
                if [ "$found_cpp" = false ] && { [ "$LANGUAGE" = "all" ] || [ "$LANGUAGE" = "cpp" ] || [ "$LANGUAGE" = "c" ]; }; then
                    sudo apt-get install -y build-essential gcc g++
                fi
                if [ "$found_py" = false ] && { [ "$LANGUAGE" = "all" ] || [ "$LANGUAGE" = "python" ]; }; then
                    sudo apt-get install -y python3 python3-pip python3-venv
                fi
                if [ "$found_java" = false ] && { [ "$LANGUAGE" = "all" ] || [ "$LANGUAGE" = "java" ]; }; then
                    sudo apt-get install -y openjdk-21-jdk
                fi
            elif command -v dnf >/dev/null 2>&1; then
                step "Installing missing packages with dnf..."
                if [ "$found_cpp" = false ]; then sudo dnf install -y gcc gcc-c++; fi
                if [ "$found_py" = false ]; then sudo dnf install -y python3 python3-pip; fi
                if [ "$found_java" = false ]; then sudo dnf install -y java-21-openjdk-devel; fi
            elif command -v pacman >/dev/null 2>&1; then
                step "Installing missing packages with pacman..."
                if [ "$found_cpp" = false ]; then sudo pacman -S --noconfirm gcc; fi
                if [ "$found_py" = false ]; then sudo pacman -S --noconfirm python; fi
                if [ "$found_java" = false ]; then sudo pacman -S --noconfirm jdk-openjdk; fi
            else
                step "Package manager not recognized. Please install missing toolchains manually."
                exit 2
            fi
            ;;
        Darwin)
            if command -v brew >/dev/null 2>&1; then
                step "Installing missing packages with Homebrew..."
                if [ "$found_cpp" = false ]; then brew install gcc; fi
                if [ "$found_py" = false ]; then brew install python@3.12; fi
                if [ "$found_java" = false ]; then brew install openjdk@21; fi
            else
                step "Homebrew not found. Please install Xcode Command Line Tools: xcode-select --install"
                exit 2
            fi
            ;;
        *)
            step "Unsupported OS: $OS"
            exit 2
            ;;
    esac
    step "Installation finished. Please re-run check-toolchain to verify."
    exit 0
else
    step "Run with --install to automatically install missing toolchains:"
    echo "  bash tools/check-toolchain.sh --install"
    exit 1
fi
