#!/usr/bin/env bash

printf "%-15s | %-10s | %s\n" "Tool" "Status" "Details"
printf "%-15s | %-10s | %s\n" "----" "------" "-------"

# C/C++ Compiler
found_cpp=false
for cmd in g++ clang++ gcc clang; do
    if command -v $cmd >/dev/null 2>&1; then
        version=$($cmd --version 2>&1 | head -n 1)
        printf "%-15s | %-10s | %s\n" "C/C++" "[OK]" "$cmd ($version)"
        found_cpp=true
        break
    fi
done
if [ "$found_cpp" = false ]; then
    printf "%-15s | %-10s | %s\n" "C/C++" "[MISSING]" "g++, clang++, gcc, or clang not found"
fi

# Python
found_py=false
for cmd in python3 python; do
    if command -v $cmd >/dev/null 2>&1; then
        version_str=$($cmd --version 2>&1 | head -n 1)
        version=${version_str#Python }
        if [[ $version == 3.* ]]; then
            minor=$(echo $version | cut -d. -f2)
            if [ "$minor" -ge 10 ]; then
                printf "%-15s | %-10s | %s\n" "Python" "[OK]" "$cmd ($version)"
                found_py=true
                break
            else
                printf "%-15s | %-10s | %s\n" "Python" "[WARN]" "$cmd ($version, >= 3.10 recommended)"
                found_py=true
                break
            fi
        fi
    fi
done
if [ "$found_py" = false ]; then
    printf "%-15s | %-10s | %s\n" "Python" "[MISSING]" "Python 3.10+ not found"
fi

# Java JDK
found_java=false
if command -v javac >/dev/null 2>&1; then
    version_str=$(javac --version 2>&1 | head -n 1)
    version=${version_str#javac }
    if [[ $version =~ ^([0-9]+) ]]; then
        major=${BASH_REMATCH[1]}
        if [ "$major" -ge 17 ]; then
            printf "%-15s | %-10s | %s\n" "Java JDK" "[OK]" "javac ($version)"
            found_java=true
        else
            printf "%-15s | %-10s | %s\n" "Java JDK" "[WARN]" "javac ($version, >= 17 recommended)"
            found_java=true
        fi
    else
        printf "%-15s | %-10s | %s\n" "Java JDK" "[OK]" "$version_str"
        found_java=true
    fi
fi
if [ "$found_java" = false ]; then
    printf "%-15s | %-10s | %s\n" "Java JDK" "[MISSING]" "javac not found (JDK 17+ recommended)"
fi
echo ""
