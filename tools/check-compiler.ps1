param(
  [switch]$Install
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host "[CodeBook] $message"
}

$gpp = Get-Command g++ -ErrorAction SilentlyContinue
if ($gpp) {
  Write-Step "C++ compiler found: $($gpp.Source)"
  & g++ --version
  exit 0
}

Write-Step "g++ was not found on PATH."

if ($Install) {
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    Write-Step "winget is not available. Install MSYS2 manually from https://www.msys2.org/."
    exit 2
  }

  Write-Step "Installing MSYS2 with winget..."
  & winget install -e --id MSYS2.MSYS2
  Write-Step "Open the MSYS2 UCRT64 terminal and run:"
  Write-Host "  pacman -S --needed mingw-w64-ucrt-x86_64-gcc"
  Write-Step "Then add C:\msys64\ucrt64\bin to your Windows PATH and restart CodeBook."
  exit 1
}

Write-Step "Install GCC with one of these options:"
Write-Host "  1. Run this script again with -Install to install MSYS2 through winget."
Write-Host "  2. Install MSYS2 manually from https://www.msys2.org/."
Write-Host "  3. Add your existing g++ folder, such as C:\msys64\ucrt64\bin, to PATH."
exit 1
