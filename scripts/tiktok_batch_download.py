#!/usr/bin/env python3
"""
TIKTOK BATCH DOWNLOADER
────────────────────────────────────────────────────────────────────────
Scarica video TikTok da un file .txt di URL (generato da tiktok_url_collector.js)

REQUISITI:
    pip install yt-dlp

USO BASE:
    python3 tiktok_batch_download.py --links TikTokLinks.txt --out /Volumes/SSD/TikTok/wireless_earbuds

USO CON LIMITE:
    python3 tiktok_batch_download.py --links TikTokLinks.txt --out /Volumes/SSD/TikTok/wireless_earbuds --max 20

STRUTTURA OUTPUT:
    /Volumes/SSD/TikTok/
    └── wireless_earbuds/
        ├── @username1__title__id.mp4
        ├── @username2__title__id.mp4
        └── download_log.csv          ← log con status di ogni download
────────────────────────────────────────────────────────────────────────
"""

import argparse
import csv
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


# ── Configurazione yt-dlp ─────────────────────────────────────────────────────

YDL_BASE_ARGS = [
    "--no-playlist",
    "--merge-output-format", "mp4",
    "--no-warnings",
    "--quiet",
    "--no-mtime",           # non sovrascrive il timestamp del file
    "--restrict-filenames",  # nomi file sicuri (no caratteri speciali)
    "--no-check-certificates",
    "--sleep-interval", "2",          # pausa 2s tra download (evita ban)
    "--max-sleep-interval", "5",      # pausa random fino a 5s
]

# Template nome file: @username__descrizione_troncata__videoID.mp4
OUTPUT_TEMPLATE = "%(uploader)s__%(title).60s__%(id)s.%(ext)s"


def check_ytdlp():
    """Verifica che yt-dlp sia installato."""
    try:
        result = subprocess.run(
            ["yt-dlp", "--version"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            print(f"[✓] yt-dlp {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    print("[✗] yt-dlp non trovato. Installa con: pip install yt-dlp")
    sys.exit(1)


def load_urls(links_file: str, max_videos: int | None) -> list[str]:
    """Carica e deduplicazione URL dal file .txt."""
    path = Path(links_file)
    if not path.exists():
        print(f"[✗] File non trovato: {links_file}")
        sys.exit(1)

    lines = path.read_text(encoding="utf-8").strip().splitlines()
    urls = list(dict.fromkeys(           # deduplica mantenendo ordine
        l.strip() for l in lines
        if l.strip() and "tiktok.com" in l and "/video/" in l
    ))

    print(f"[i] URL trovati (unici): {len(urls)}")

    if max_videos and len(urls) > max_videos:
        urls = urls[:max_videos]
        print(f"[i] Limitati a: {max_videos}")

    return urls


def download_video(url: str, output_dir: str) -> dict:
    """Scarica un singolo video. Restituisce dict con status."""
    cmd = [
        "yt-dlp",
        *YDL_BASE_ARGS,
        "--output", str(Path(output_dir) / OUTPUT_TEMPLATE),
        url
    ]

    start = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    elapsed = round(time.time() - start, 1)

    success = result.returncode == 0
    error = ""
    if not success:
        # Estrai messaggio di errore principale
        stderr = result.stderr.strip()
        stdout = result.stdout.strip()
        error = (stderr or stdout)[:200]

    return {
        "url": url,
        "status": "ok" if success else "error",
        "error": error,
        "elapsed_s": elapsed,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
    }


def save_log(log_entries: list[dict], output_dir: str):
    """Salva il log CSV nella cartella di output."""
    log_path = Path(output_dir) / "download_log.csv"
    fields = ["url", "status", "error", "elapsed_s", "timestamp"]

    with open(log_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(log_entries)

    print(f"\n[✓] Log salvato: {log_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Scarica video TikTok da un file di URL."
    )
    parser.add_argument(
        "--links", required=True,
        help="Percorso al file TikTokLinks.txt"
    )
    parser.add_argument(
        "--out", required=True,
        help="Cartella di destinazione (es. /Volumes/SSD/TikTok/wireless_earbuds)"
    )
    parser.add_argument(
        "--max", type=int, default=None,
        help="Numero massimo di video da scaricare (default: tutti)"
    )
    parser.add_argument(
        "--delay", type=float, default=2.0,
        help="Pausa in secondi tra un download e l'altro (default: 2)"
    )
    args = parser.parse_args()

    # ── Setup ──────────────────────────────────────────────────────────
    check_ytdlp()

    output_dir = Path(args.out)
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"[i] Output: {output_dir}")

    urls = load_urls(args.links, args.max)

    if not urls:
        print("[!] Nessun URL valido trovato nel file.")
        sys.exit(0)

    # ── Download loop ──────────────────────────────────────────────────
    log = []
    ok_count = 0
    fail_count = 0

    print(f"\n{'─'*60}")
    print(f"Avvio download di {len(urls)} video...")
    print(f"{'─'*60}\n")

    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] {url[:80]}...")

        entry = download_video(url, str(output_dir))
        log.append(entry)

        if entry["status"] == "ok":
            ok_count += 1
            print(f"  ✓ Scaricato ({entry['elapsed_s']}s)")
        else:
            fail_count += 1
            print(f"  ✗ Errore: {entry['error'][:100]}")

        # Pausa tra download (evita rate limiting)
        if i < len(urls):
            time.sleep(args.delay)

    # ── Riepilogo ──────────────────────────────────────────────────────
    print(f"\n{'─'*60}")
    print(f"COMPLETATO")
    print(f"  ✓ Scaricati:  {ok_count}")
    print(f"  ✗ Errori:     {fail_count}")
    print(f"  Totale:       {len(urls)}")
    print(f"{'─'*60}")

    save_log(log, str(output_dir))

    # Mostra file scaricati
    mp4_files = sorted(output_dir.glob("*.mp4"))
    if mp4_files:
        print(f"\nFile nella cartella ({len(mp4_files)} video):")
        for f in mp4_files[:10]:
            size_mb = f.stat().st_size / (1024 * 1024)
            print(f"  {f.name[:70]} ({size_mb:.1f} MB)")
        if len(mp4_files) > 10:
            print(f"  ... e altri {len(mp4_files) - 10} file")


if __name__ == "__main__":
    main()
