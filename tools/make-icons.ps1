# Renders tools/icon.svg into the PNG app icons using headless Chrome (or Edge).
# Usage (from the project folder):  powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$browser = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Chrome or Edge not found.' }

$svg = Get-Content -Raw -Encoding UTF8 (Join-Path $root 'tools\icon.svg')
# Maskable variant: full-bleed background, artwork shrunk into the safe zone.
$maskable = $svg -replace 'rx="116"', 'rx="0"' -replace 'translate\(256 262\)', 'translate(256 262) scale(0.74)'
$tmp = Join-Path $env:TEMP 'szokincs-icons'
New-Item -ItemType Directory -Force $tmp | Out-Null
New-Item -ItemType Directory -Force (Join-Path $root 'icons') | Out-Null

function Render($svgText, $size, $outName) {
  $html = "<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block;width:${size}px;height:${size}px}</style></head><body>$svgText</body></html>"
  $page = Join-Path $tmp "$outName.html"
  [IO.File]::WriteAllText($page, $html, [Text.Encoding]::UTF8)
  $out = Join-Path $root "icons\$outName"
  if (Test-Path $out) { Remove-Item $out }
  # Chrome reports progress on stderr; don't treat that as a failure.
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $browser --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 --force-device-scale-factor=1 "--window-size=$size,$size" "--screenshot=$out" "file:///$($page -replace '\\','/')" 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  if (-not (Test-Path $out)) { throw "Failed to render $outName" }
  Write-Host "wrote icons\$outName"
}

Render $svg 512 'icon-512.png'
Render $svg 192 'icon-192.png'
Render $maskable 512 'maskable-512.png'
