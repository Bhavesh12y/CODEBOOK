param(
  [string]$Language = "all",
  [switch]$Install
)

$scriptPath = Join-Path $PSScriptRoot "check-toolchain.ps1"
if ($Install) {
  & powershell -ExecutionPolicy Bypass -File $scriptPath -Language $Language -Install
} else {
  & powershell -ExecutionPolicy Bypass -File $scriptPath -Language $Language
}
exit $LASTEXITCODE
