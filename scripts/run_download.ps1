#Requires -Version 5.1
<#
.SYNOPSIS
    Interactive launcher for tiktok-asset-hunter.
.DESCRIPTION
    Checks D:\ drive, prompts for parameters, runs the downloader,
    and optionally generates an HTML engagement report.
.NOTES
    Run from the project root: .\scripts\run_download.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$OUTPUT_BASE = "D:\Products Reels"

Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkYellow
Write-Host "       tiktok-asset-hunter launcher          " -ForegroundColor DarkYellow
Write-Host "  ============================================" -ForegroundColor DarkYellow
Write-Host ""

# ── 1. Verify D:\ drive ───────────────────────────────────────────────────────
if (-not (Test-Path "D:\")) {
    Write-Host "  [X] Drive D:\ not found. Connect your external SSD and try again." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Drive D:\ detected." -ForegroundColor Green
Write-Host ""

# ── 2. Keyword ────────────────────────────────────────────────────────────────
$keyword = Read-Host "  Keyword (e.g. wireless earbuds)"
if ([string]::IsNullOrWhiteSpace($keyword)) {
    Write-Host "  [X] Keyword cannot be empty." -ForegroundColor Red
    exit 1
}

# ── 3. Links file ─────────────────────────────────────────────────────────────
$defaultLinks = "links\TikTokLinks.txt"
$linksInput   = Read-Host "  Links file path [default: $defaultLinks]"

if ([string]::IsNullOrWhiteSpace($linksInput)) {
    $linksFile = $defaultLinks
} else {
    $linksFile = $linksInput
}

if (-not (Test-Path $linksFile)) {
    Write-Host "  [X] Links file not found: $linksFile" -ForegroundColor Red
    exit 1
}

# ── 4. Max videos ─────────────────────────────────────────────────────────────
$defaultMax = 30
$maxInput   = Read-Host "  Max videos [default: $defaultMax]"

if ([string]::IsNullOrWhiteSpace($maxInput)) {
    $maxVideos = $defaultMax
} else {
    $maxVideos = [int]$maxInput
}

# ── 5. Build output path ──────────────────────────────────────────────────────
$safeName   = $keyword -replace '[\\/:*?<>|]', '_'
$outputPath = "$OUTPUT_BASE\$safeName"

Write-Host ""
Write-Host "  --------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Keyword    : $keyword"
Write-Host "  Links file : $linksFile"
Write-Host "  Max videos : $maxVideos"
Write-Host "  Output     : $outputPath" -ForegroundColor Cyan
Write-Host "  --------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# ── 6. Confirmation ───────────────────────────────────────────────────────────
$confirm = Read-Host "  Start download? [Y/n]"
if ($confirm -match '^[Nn]') {
    Write-Host "  Cancelled." -ForegroundColor Yellow
    exit 0
}

# ── 7. Run downloader ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  [>>] Running tiktok_batch_download.py..." -ForegroundColor Cyan

python scripts\tiktok_batch_download.py --links $linksFile --out $outputPath --max $maxVideos

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [X] Download script exited with error code $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "  [OK] Download complete." -ForegroundColor Green

# ── 8. Optional: engagement report ───────────────────────────────────────────
$logPath    = "$outputPath\download_log.csv"
$reportPath = "$outputPath\report.html"

if (Test-Path $logPath) {
    Write-Host ""
    $genReport = Read-Host "  Generate HTML engagement report? [Y/n]"
    if ($genReport -notmatch '^[Nn]') {
        Write-Host "  [>>] Generating report..." -ForegroundColor Cyan

        python scripts\generate_report.py --log $logPath --out $reportPath --keyword $keyword

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Report saved: $reportPath" -ForegroundColor Green
            Start-Process $reportPath
        } else {
            Write-Host "  [X] Report generation failed." -ForegroundColor Red
        }
    }
} else {
    Write-Host "  [!] No download_log.csv found - skipping report." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Done. Output folder: $outputPath" -ForegroundColor Green
Write-Host ""
