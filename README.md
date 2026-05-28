# tiktok-asset-hunter

Tool for collecting and downloading competitor videos from **TikTok** and **Instagram** for dropshipping product research.

## Supported pages

| URL pattern | What it collects |
|---|---|
| `tiktok.com/search/video?q=KEYWORD` | TikTok search results |
| `tiktok.com/@username` | TikTok profile grid |
| `instagram.com/username` | Instagram profile grid (posts + reels) |

---

## Workflow

### Step 1 — Collect URLs from the browser (any OS)

1. Navigate to one of the supported pages
2. Open DevTools → Console (`F12` on Windows/Linux, `Cmd+Option+J` on Mac)
3. Paste the contents of `scripts/tiktok_url_collector.js` and press Enter
4. A side panel appears — scroll the page to load more cards
5. Check the videos you want to download
6. Click **CSV ↓** in the panel

The exported file is named automatically:
```
tiktok_search_wireless_earbuds_20260419_1430.csv
tiktok_profile_username_20260419_1430.csv
ig_profile_username_20260419_1430.csv
```

7. Copy the `.csv` file into `links/queue/[keyword]/` (e.g. `links/queue/wireless_earbuds/`)

Console helpers:
```js
showStatus()     // log how many videos are selected / found
resetCollector() // clear everything and remove the UI
```

---

### Step 2 — Download videos

**Windows (PowerShell launcher — recommended):**
```powershell
.\scripts\run_download.ps1
```
The launcher reads all `.csv` / `.txt` files in `links/queue/` automatically and prompts for the output keyword.

**Windows (manual):**
```powershell
python scripts\tiktok_batch_download.py `
  --links links\queue\tiktok_search_earbuds_20260419_1430.csv `
  --out "D:\Products Reels\wireless_earbuds\raw"
```

**Mac / Linux (bash launcher — recommended):**
```bash
bash scripts/run_download.sh
```

**Mac / Linux (manual):**
```bash
python3 scripts/tiktok_batch_download.py \
  --links links/queue/tiktok_search_earbuds_20260419_1430.csv \
  --out "/path/to/Products Reels/wireless_earbuds/raw"
```

**Multiple files + limit:**
```bash
python3 scripts/tiktok_batch_download.py \
  --links links/queue/file1.csv links/queue/file2.csv \
  --out "/path/to/Products Reels/earbuds/raw" \
  --max 30
```

**Cookie options** (required for TikTok login):

| Flag | When to use |
|---|---|
| `--browser chrome` | Default. Chrome must be **closed** before running |
| `--browser firefox` | Use Firefox cookies instead |
| `--cookies-file links/cookies.txt` | When Chrome is open (export cookies with a browser extension) |

---

### Step 3 — Generate engagement report (optional)

**Windows:**
```powershell
python scripts\generate_report.py `
  --log "D:\Products Reels\wireless_earbuds\raw\download_log.csv" `
  --out "D:\Products Reels\wireless_earbuds\report.html" `
  --keyword "wireless earbuds"
```

**Mac / Linux:**
```bash
python3 scripts/generate_report.py \
  --log "/path/to/Products Reels/wireless_earbuds/raw/download_log.csv" \
  --out "/path/to/Products Reels/wireless_earbuds/report.html" \
  --keyword "wireless earbuds"
```

Opens `report.html` in the browser — videos ranked by engagement rate (likes + comments + shares / views).

---

## Output structure

```
[output folder]/
└── wireless_earbuds/
    ├── raw/
    │   ├── @username__title__videoID.mp4
    │   └── download_log.csv
    └── report.html
```

---

## Requirements

| Tool | Version | Install |
|---|---|---|
| Python | 3.10+ | python.org |
| yt-dlp | latest | `pip install yt-dlp` |

No other dependencies. All scripts use Python standard library only.

---

## Project structure

```
tiktok-asset-hunter/
├── scripts/
│   ├── tiktok_url_collector.js   — paste into browser console
│   ├── tiktok_batch_download.py  — download from CSV/TXT files
│   ├── generate_report.py        — HTML engagement report
│   ├── run_download.sh           — interactive bash launcher (Mac/Linux)
│   └── run_download.ps1          — interactive PowerShell launcher (Windows)
├── links/
│   ├── cookies.txt               — TikTok cookies (not committed)
│   └── queue/
│       └── [keyword]/            — CSV/TXT files per product (not committed)
└── logs/
```

---

## Notes

- **TikTok login required** — yt-dlp needs cookies from a logged-in browser session
- **Instagram** — no extra cookie setup needed; `--browser chrome` works if you are logged in to Instagram in Chrome
- **Duplicate URLs** — automatically deduplicated across multiple input files
- On **Mac/Linux** use `python3` instead of `python`
- On **Windows** use `python` (Microsoft Store Python or standard installer)
