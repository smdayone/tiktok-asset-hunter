# CLAUDE.md — Instructions for Claude Code

## Project
tiktok-asset-hunter — batch TikTok video downloader for dropshipping competitor research

## Operating System
macOS — use `python3` and forward-slash paths

## Operational Rules
- DO NOT commit .txt files containing URLs (they hold temporary data)
- DO NOT commit .mp4 or any video format files
- DO NOT commit CSV log files
- Use `python3` (not `python`) on macOS

## Main Scripts
- `scripts/tiktok_url_collector.js` — paste into the browser console
- `scripts/tiktok_batch_download.py` — run from PowerShell/CMD
- `scripts/generate_report.py` — generates an HTML engagement report from download_log.csv
- `scripts/run_download.ps1` — interactive PowerShell launcher

## Output Path
Expected structure: /Users/die_u97/Movies/Reels Assets/Products Reels/[keyword]/raw/
To change the base path, update `$OUTPUT_BASE` in `scripts/run_download.ps1` or pass `--out` directly to the Python script.

## Cookies
Save cookies manually to `links/cookies.txt` (Netscape format, exported from browser extension).

## Commit Message Format
feat: short description
fix: short description
docs: short description
