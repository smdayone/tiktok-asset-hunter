# tiktok-asset-hunter

Tool per raccogliere e scaricare video competitor da TikTok per ricerca prodotti dropshipping.

## Workflow

### Step 1 — Raccogli URL dal browser
1. Vai su tiktok.com e cerca la keyword (es. "wireless earbuds")
2. Apri DevTools → Console (F12)
3. Incolla il contenuto di `scripts/tiktok_url_collector.js`
4. Scorri la pagina manualmente
5. Digita `downloadLinks()` → salva il file .txt in `links/`

### Step 2 — Scarica i video sull'SSD esterno
```powershell
python scripts/tiktok_batch_download.py `
  --links links/TikTokLinks.txt `
  --out "E:\TikTok\wireless_earbuds" `
  --max 30
```

## Struttura output SSD
```
E:\TikTok\
├── wireless_earbuds\
│   ├── @username__title__id.mp4
│   └── download_log.csv
├── smart_watch\
└── ring_light\
```

## Requisiti

- Python 3.10+
- yt-dlp (`pip install yt-dlp`)
- Git for Windows
