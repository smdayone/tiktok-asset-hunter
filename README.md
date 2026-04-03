# tiktok-asset-hunter

Tool for collecting and downloading competitor videos from TikTok for dropshipping product research.

## Workflow

### Step 1 — Collect URLs from the browser
1. Go to tiktok.com and search for your keyword (e.g. "wireless earbuds")
2. Open DevTools → Console (F12)
3. Paste the contents of `scripts/tiktok_url_collector.js`
4. Scroll the page manually
5. Type `downloadLinks()` → saves the .txt file to `links/`

### Step 2 — Download videos to the external SSD
```powershell
python scripts\tiktok_batch_download.py `
  --links links\TikTokLinks.txt `
  --out "D:\Products Reels\wireless_earbuds" `
  --max 30
```

### Step 3 — Generate engagement report (optional)
```powershell
python scripts\generate_report.py `
  --log "D:\Products Reels\wireless_earbuds\download_log.csv" `
  --out "D:\Products Reels\wireless_earbuds\report.html" `
  --keyword "wireless earbuds"
```

### Or use the PowerShell launcher (recommended)
```powershell
.\scripts\run_download.ps1
```

## Output structure on SSD
```
D:\Products Reels\
├── wireless_earbuds\
│   ├── @username__title__id.mp4
│   ├── download_log.csv
│   └── report.html
├── smart_watch\
└── ring_light\
```

## Requirements

- Python 3.10+
- yt-dlp (`pip install yt-dlp`)
- Git for Windows
