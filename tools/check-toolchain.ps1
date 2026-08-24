$ErrorActionPreference = "Stop"

function Check-Command {
    param([string]$cmd)
    try {
        $path = Get-Command $cmd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
        return $path
    } catch {
        return $null
    }
}

function Write-Row {
    param([string]$name, [string]$status, [string]$detail)
    Write-Host ("{0,-15} | {1,-10} | {2}" -f $name, $status, $detail)
}

Write-Host "CodeBook Toolchain Check"
Write-Host "========================"
Write-Row "Tool" "Status" "Details"
Write-Row "----" "------" "-------"

# C/C++ Compiler
$cpp_compilers = @("g++", "clang++", "gcc", "clang")
$found_cpp = $false
foreach ($c in $cpp_compilers) {
    $path = Check-Command $c
    if ($path) {
        $version = & $c --version 2>&1 | Select-Object -First 1
        Write-Row "C/C++" "[OK]" "$c ($version)"
        $found_cpp = $true
        break
    }
}
if (-not $found_cpp) {
    Write-Row "C/C++" "[MISSING]" "g++, clang++, gcc, or clang not found"
}

# Python
$python_cmds = @("python", "python3")
$found_py = $false
foreach ($p in $python_cmds) {
    $path = Check-Command $p
    if ($path) {
        $versionStr = & $p --version 2>&1 | Select-Object -First 1
        $version = $versionStr -replace "Python ", ""
        if ($version -match "^3\.") {
            $major, $minor = $version.Split('.')[0..1]
            if ([int]$major -eq 3 -and [int]$minor -ge 10) {
                Write-Row "Python" "[OK]" "$p ($version)"
                $found_py = $true
                break
            } else {
                Write-Row "Python" "[WARN]" "$p ($version, >= 3.10 recommended)"
                $found_py = $true
                break
            }
        }
    }
}
if (-not $found_py) {
    Write-Row "Python" "[MISSING]" "Python 3.10+ not found"
}

# Java JDK
$found_java = $false
$path = Check-Command "javac"
if ($path) {
    $versionStr = & javac --version 2>&1 | Select-Object -First 1
    $version = $versionStr -replace "javac ", ""
    if ($version -match "^(\d+)") {
        $major = [int]$matches[1]
        if ($major -ge 17) {
            Write-Row "Java JDK" "[OK]" "javac ($version)"
            $found_java = $true
        } else {
            Write-Row "Java JDK" "[WARN]" "javac ($version, >= 17 recommended)"
            $found_java = $true
        }
    } else {
        Write-Row "Java JDK" "[OK]" "$versionStr"
        $found_java = $true
    }
}
if (-not $found_java) {
    Write-Row "Java JDK" "[MISSING]" "javac not found (JDK 17+ recommended)"
}
Write-Host ""
