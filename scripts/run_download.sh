#!/usr/bin/env bash
# Interactive launcher for tiktok-asset-hunter (macOS/Linux)
# Usage: bash scripts/run_download.sh  (from project root)

set -euo pipefail

OUTPUT_BASE="/Users/die_u97/Movies/Reels Assets/Products Reels"
QUEUE_DIR="links/queue"

echo ""
echo "  ============================================"
echo "       tiktok-asset-hunter launcher          "
echo "  ============================================"
echo ""

# ── 1. Ensure output base exists ─────────────────────────────────────────────
mkdir -p "$OUTPUT_BASE"
echo "  [OK] Output base: $OUTPUT_BASE"
echo ""

# ── 2. Read links from queue folder ──────────────────────────────────────────
mkdir -p "$QUEUE_DIR"

mapfile -t LINK_FILES < <(find "$QUEUE_DIR" -maxdepth 1 \( -name "*.csv" -o -name "*.txt" \) -type f 2>/dev/null | sort)

if [[ ${#LINK_FILES[@]} -eq 0 ]]; then
    echo "  [X] No .csv or .txt files found in $QUEUE_DIR"
    echo "      Export TikTokLinks.csv from the browser collector and copy it there."
    exit 1
fi

echo "  [OK] Files found in $QUEUE_DIR :"
for f in "${LINK_FILES[@]}"; do
    echo "       - $(basename "$f")"
done
echo ""

# ── 3. Keyword ────────────────────────────────────────────────────────────────
read -rp "  Keyword (e.g. wireless earbuds): " KEYWORD
if [[ -z "${KEYWORD// }" ]]; then
    echo "  [X] Keyword cannot be empty."
    exit 1
fi

# ── 4. Cookie method ──────────────────────────────────────────────────────────
DEFAULT_COOKIES_FILE="links/cookies.txt"
echo "  Cookie method:"
echo "    [1] Browser (requires browser closed)  <- default"
echo "    [2] cookies.txt file (works with browser open)"
read -rp "  Choose [1/2, default: 1]: " COOKIE_METHOD

if [[ "$COOKIE_METHOD" == "2" ]]; then
    read -rp "  Path to cookies.txt [default: $DEFAULT_COOKIES_FILE]: " COOKIES_INPUT
    COOKIES_FILE="${COOKIES_INPUT:-$DEFAULT_COOKIES_FILE}"
    COOKIE_ARG="--cookies-file"
    COOKIE_VAL="$COOKIES_FILE"
    COOKIE_DESC="cookies.txt: $COOKIES_FILE"
else
    DEFAULT_BROWSER="chrome"
    read -rp "  Browser [chrome/firefox/safari, default: $DEFAULT_BROWSER]: " BROWSER_INPUT
    BROWSER="${BROWSER_INPUT:-$DEFAULT_BROWSER}"
    BROWSER="${BROWSER,,}"
    COOKIE_ARG="--browser"
    COOKIE_VAL="$BROWSER"
    COOKIE_DESC="browser: $BROWSER"
fi

# ── 5. Build output path ──────────────────────────────────────────────────────
SAFE_NAME="${KEYWORD//[\\/:*?<>|]/_}"
KEYWORD_PATH="$OUTPUT_BASE/$SAFE_NAME"
OUTPUT_PATH="$KEYWORD_PATH/raw"

echo ""
echo "  --------------------------------------------"
echo "  Keyword    : $KEYWORD"
echo "  Files      : ${#LINK_FILES[@]} file(s) from $QUEUE_DIR"
echo "  Cookies    : $COOKIE_DESC"
echo "  Videos     : $OUTPUT_PATH"
echo "  Report     : $KEYWORD_PATH/report.html"
echo "  --------------------------------------------"
echo ""

# ── 6. Confirmation ───────────────────────────────────────────────────────────
read -rp "  Start download? [Y/n]: " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn] ]]; then
    echo "  Cancelled."
    exit 0
fi

# ── 7. Run downloader ─────────────────────────────────────────────────────────
echo ""
echo "  [>>] Running tiktok_batch_download.py..."

python3 scripts/tiktok_batch_download.py \
    --links "${LINK_FILES[@]}" \
    --out "$OUTPUT_PATH" \
    "$COOKIE_ARG" "$COOKIE_VAL"

echo "  [OK] Download complete."

# ── 8. Optional: engagement report ───────────────────────────────────────────
LOG_PATH="$OUTPUT_PATH/download_log.csv"
REPORT_PATH="$KEYWORD_PATH/report.html"

if [[ -f "$LOG_PATH" ]]; then
    echo ""
    read -rp "  Generate HTML engagement report? [Y/n]: " GEN_REPORT
    if [[ ! "$GEN_REPORT" =~ ^[Nn] ]]; then
        echo "  [>>] Generating report..."
        python3 scripts/generate_report.py --log "$LOG_PATH" --out "$REPORT_PATH" --keyword "$KEYWORD"
        echo "  [OK] Report saved: $REPORT_PATH"
        open "$REPORT_PATH"
    fi
else
    echo "  [!] No download_log.csv found - skipping report."
fi

echo ""
echo "  Done. Output folder: $OUTPUT_PATH"
echo ""
