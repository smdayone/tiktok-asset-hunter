#Requires -Version 5.1
<#
.SYNOPSIS
    Interactive launcher for tiktok-asset-hunter.
.DESCRIPTION
    Reads all .csv/.txt files from links\queue\, runs the downloader,
    and optionally generates an HTML engagement report.
.NOTES
    Run from the project root: .\scripts\run_download.ps1
    Workflow:
      1. Export TikTokLinks.csv from the browser collector
      2. Copy it to links\queue\
      3. Run this script
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$OUTPUT_BASE = "/Users/die_u97/Movies/Reels Assets/Products Reels"
$QUEUE_DIR   = "links/queue"

Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkYellow
Write-Host "       tiktok-asset-hunter launcher          " -ForegroundColor DarkYellow
Write-Host "  ============================================" -ForegroundColor DarkYellow
Write-Host ""

# ── 1. Verify output base folder ─────────────────────────────────────────────
if (-not (Test-Path $OUTPUT_BASE)) {
    New-Item -ItemType Directory -Path $OUTPUT_BASE -Force | Out-Null
}
Write-Host "  [OK] Output base: $OUTPUT_BASE" -ForegroundColor Green
Write-Host ""

# ── 2. Read links from queue folder ──────────────────────────────────────────
if (-not (Test-Path $QUEUE_DIR)) {
    New-Item -ItemType Directory -Path $QUEUE_DIR -Force | Out-Null
}

$linkFiles = @(Get-ChildItem -Path "$QUEUE_DIR\*" -Include "*.csv","*.txt" -File -ErrorAction SilentlyContinue)

if ($linkFiles.Count -eq 0) {
    Write-Host "  [X] No .csv or .txt files found in $QUEUE_DIR" -ForegroundColor Red
    Write-Host "      Export TikTokLinks.csv from the browser collector and copy it there." -ForegroundColor Yellow
    exit 1
}

Write-Host "  [OK] Files found in $QUEUE_DIR :" -ForegroundColor Green
foreach ($f in $linkFiles) {
    Write-Host "       - $($f.Name)"
}
Write-Host ""

# ── 3. Keyword ────────────────────────────────────────────────────────────────
$keyword = Read-Host "  Keyword (e.g. wireless earbuds)"
if ([string]::IsNullOrWhiteSpace($keyword)) {
    Write-Host "  [X] Keyword cannot be empty." -ForegroundColor Red
    exit 1
}

# ── 4. Cookie method ─────────────────────────────────────────────────────────
$defaultCookiesFile = "links/cookies.txt"
Write-Host "  Cookie method:"
Write-Host "    [1] Browser (requires browser closed)  <- default"
Write-Host "    [2] cookies.txt file (works with browser open)"
$cookieMethod = Read-Host "  Choose [1/2, default: 1]"

if ($cookieMethod -eq "2") {
    $cookiesFileInput = Read-Host "  Path to cookies.txt [default: $defaultCookiesFile]"
    if ([string]::IsNullOrWhiteSpace($cookiesFileInput)) {
        $cookiesFile = $defaultCookiesFile
    } else {
        $cookiesFile = $cookiesFileInput
    }
    $cookieArg  = "--cookies-file"
    $cookieVal  = $cookiesFile
    $cookieDesc = "cookies.txt: $cookiesFile"
} else {
    $defaultBrowser = "chrome"
    $browserInput   = Read-Host "  Browser [chrome/edge/firefox, default: $defaultBrowser]"
    if ([string]::IsNullOrWhiteSpace($browserInput)) {
        $browser = $defaultBrowser
    } else {
        $browser = $browserInput.ToLower().Trim()
    }
    $cookieArg  = "--browser"
    $cookieVal  = $browser
    $cookieDesc = "browser: $browser"
}

# ── 5. Build output path ──────────────────────────────────────────────────────
$safeName    = $keyword -replace '[\\/:*?<>|]', '_'
$keywordPath = "$OUTPUT_BASE/$safeName"
$outputPath  = "$keywordPath/raw"

Write-Host ""
Write-Host "  --------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Keyword    : $keyword"
Write-Host "  Files      : $($linkFiles.Count) file(s) from $QUEUE_DIR"
Write-Host "  Cookies    : $cookieDesc"
Write-Host "  Videos     : $outputPath" -ForegroundColor Cyan
Write-Host "  Report     : $keywordPath/report.html" -ForegroundColor Cyan
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

$linkPaths = $linkFiles.FullName

& python scripts\tiktok_batch_download.py --links $linkPaths --out $outputPath $cookieArg $cookieVal

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [X] Download script exited with error code $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "  [OK] Download complete." -ForegroundColor Green

# ── 8. Optional: engagement report ───────────────────────────────────────────
$logPath    = "$outputPath/download_log.csv"
$reportPath = "$keywordPath/report.html"

if (Test-Path $logPath) {
    Write-Host ""
    $genReport = Read-Host "  Generate HTML engagement report? [Y/n]"
    if ($genReport -notmatch '^[Nn]') {
        Write-Host "  [>>] Generating report..." -ForegroundColor Cyan

        & python scripts\generate_report.py --log $logPath --out $reportPath --keyword $keyword

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
