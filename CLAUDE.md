# CLAUDE.md — Instructions for Claude Code

## Project
tiktok-asset-hunter — batch TikTok video downloader for dropshipping competitor research

## Operating System
Windows 11 — use Windows/PowerShell commands where possible
External SSD path: D:\Products Reels\ (verify drive letter before operating)

## Operational Rules
- DO NOT commit .txt files containing URLs (they hold temporary data)
- DO NOT commit .mp4 or any video format files
- DO NOT commit CSV log files
- Before every download, verify the SSD is mounted
- Use `python` (not `python3`) on Windows unless otherwise specified

## Main Scripts
- `scripts/tiktok_url_collector.js` — paste into the browser console
- `scripts/tiktok_batch_download.py` — run from PowerShell/CMD
- `scripts/generate_report.py` — generates an HTML engagement report from download_log.csv
- `scripts/run_download.ps1` — interactive PowerShell launcher

## SSD Path
Expected structure: D:\Products Reels\[keyword]\
If the drive letter changes, update the path in the --out argument or in run_download.ps1

## Commit Message Format
feat: short description
fix: short description
docs: short description
