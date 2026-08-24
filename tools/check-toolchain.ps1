param(
  [string]$Language = "all",
  [switch]$Install
)

$ErrorActionPreference = "Continue"

function Write-Step($message) {
  Write-Host "[CodeBook] $message"
}

function Write-Row {
  param([string]$name, [string]$status, [string]$detail)
  Write-Host ("{0,-15} | {1,-10} | {2}" -f $name, $status, $detail)
}

function Check-Command {
  param([string]$cmd)
  try {
    $path = Get-Command $cmd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
    return $path
  } catch {
    return $null
  }
}

Write-Host ""
Write-Host "================================================="
Write-Host "       CodeBook Multi-Language Toolchain Check   "
Write-Host "================================================="
Write-Row "Language" "Status" "Details"
Write-Row "--------" "------" "-------"

# 1. C & C++ (GCC / Clang)
$cpp_compilers = @("g++", "clang++", "gcc", "clang")
$found_cpp = $false
$cpp_detail = ""
foreach ($c in $cpp_compilers) {
  $path = Check-Command $c
  if ($path) {
    try {
      $version = & $c --version 2>&1 | Select-Object -First 1
      $cpp_detail = "$c ($version)"
      $found_cpp = $true
      break
    } catch {}
  }
}

if ($found_cpp) {
  Write-Row "C / C++" "[OK]" $cpp_detail
} else {
  Write-Row "C / C++" "[MISSING]" "g++, clang++, or gcc not found on PATH"
}

# 2. Python (3.10+)
$found_py = $false
$py_detail = ""
$py_candidates = @()
if ($env:VIRTUAL_ENV) {
  $py_candidates += (Join-Path $env:VIRTUAL_ENV "Scripts\python.exe")
}
$py_candidates += @("python", "python3", "py")
foreach ($p in $py_candidates) {
  $path = Check-Command $p
  if ($path -and $path -notmatch "WindowsApps") {
    try {
      $versionStr = & $path --version 2>&1 | Select-Object -First 1
      if ($LASTEXITCODE -eq 0 -and $versionStr -match "Python\s+3\.(\d+)") {
        $minor = [int]$matches[1]
        if ($minor -ge 10) {
          $py_detail = "$p ($versionStr)"
          $found_py = $true
          break
        } else {
          $py_detail = "$p ($versionStr, >= 3.10 recommended)"
          $found_py = $true
          break
        }
      }
    } catch {}
  }
}

if ($found_py) {
  Write-Row "Python" "[OK]" $py_detail
} else {
  Write-Row "Python" "[MISSING]" "Python 3.10+ not found on PATH"
}

# 3. Java JDK (17+)
$found_java = $false
$java_detail = ""
$javac_path = Check-Command "javac"
if ($javac_path) {
  try {
    $versionStr = & javac --version 2>&1 | Select-Object -First 1
    if ($versionStr -match "javac\s+(\d+)") {
      $major = [int]$matches[1]
      if ($major -ge 17) {
        $java_detail = "javac ($versionStr)"
        $found_java = $true
      } else {
        $java_detail = "javac ($versionStr, >= 17 recommended)"
        $found_java = $true
      }
    } else {
      $java_detail = "$versionStr"
      $found_java = $true
    }
  } catch {}
}

if ($found_java) {
  Write-Row "Java (JDK)" "[OK]" $java_detail
} else {
  Write-Row "Java (JDK)" "[MISSING]" "javac (JDK 17+) not found on PATH"
}

Write-Host "================================================="
Write-Host ""

$all_ok = $found_cpp -and $found_py -and $found_java

if ($all_ok) {
  Write-Step "All toolchains (C/C++, Python, Java) are installed and ready!"
  exit 0
}

if ($Install) {
  $winget = Check-Command "winget"
  if (-not $winget) {
    Write-Step "winget is not available on this system. Please install missing toolchains manually."
    exit 2
  }

  if (-not $found_cpp -and ($Language -eq "all" -or $Language -eq "cpp" -or $Language -eq "c")) {
    Write-Step "Installing MSYS2 GCC/G++ toolchain via winget..."
    & winget install -e --id MSYS2.MSYS2 --accept-package-agreements --accept-source-agreements
    Write-Step "To complete C/C++ setup, open the MSYS2 UCRT64 terminal and run:"
    Write-Host "  pacman -S --needed mingw-w64-ucrt-x86_64-gcc"
    Write-Step "Then ensure C:\msys64\ucrt64\bin is added to your Windows PATH."
  }

  if (-not $found_py -and ($Language -eq "all" -or $Language -eq "python")) {
    Write-Step "Installing Python 3.12 via winget..."
    & winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
  }

  if (-not $found_java -and ($Language -eq "all" -or $Language -eq "java")) {
    Write-Step "Installing Eclipse Temurin OpenJDK 21 via winget..."
    & winget install -e --id EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements
  }

  Write-Step "Installation steps completed. Restart your terminal or CodeBook to apply PATH changes."
  exit 0
} else {
  Write-Step "Missing toolchain(s) detected. You can install them automatically by running:"
  Write-Host "  powershell -ExecutionPolicy Bypass -File tools\check-toolchain.ps1 -Install"
  Write-Host ""
  Write-Step "Or install individual languages:"
  Write-Host "  powershell -ExecutionPolicy Bypass -File tools\check-toolchain.ps1 -Language cpp -Install"
  Write-Host "  powershell -ExecutionPolicy Bypass -File tools\check-toolchain.ps1 -Language python -Install"
  Write-Host "  powershell -ExecutionPolicy Bypass -File tools\check-toolchain.ps1 -Language java -Install"
  exit 1
}
