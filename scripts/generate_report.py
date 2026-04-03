#!/usr/bin/env python3
"""
TIKTOK ENGAGEMENT REPORT GENERATOR
────────────────────────────────────────────────────────────────────────
Reads download_log.csv and generates an interactive HTML report with
engagement metrics, sortable by likes, views, comments, shares, and
engagement rate.

USAGE:
    python scripts/generate_report.py \
        --log "D:\\Products Reels\\wireless_earbuds\\download_log.csv" \
        --out "D:\\Products Reels\\wireless_earbuds\\report.html" \
        --keyword "wireless earbuds"
────────────────────────────────────────────────────────────────────────
"""

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_int(val) -> int:
    """Convert value to int, returning 0 on failure."""
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


def _safe_float(val) -> float:
    """Convert value to float, returning 0.0 on failure."""
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def fmt_number(n: int) -> str:
    """Format number with K / M suffix for display."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def engagement_rate(views: int, likes: int, comments: int, shares: int) -> float:
    """Engagement rate = (likes + comments + shares) / views × 100."""
    if views <= 0:
        return 0.0
    return round((likes + comments + shares) / views * 100, 2)


def er_class(er: float) -> str:
    """CSS class for engagement rate color coding."""
    if er >= 5.0:
        return "er-green"
    if er >= 2.0:
        return "er-orange"
    return "er-red"


# ── Data loading ──────────────────────────────────────────────────────────────

def load_log(log_path: str) -> list[dict]:
    """Load and enrich rows from download_log.csv."""
    path = Path(log_path)
    if not path.exists():
        print(f"[✗] Log file not found: {log_path}")
        sys.exit(1)

    rows = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            views    = _safe_int(row.get("views", 0))
            likes    = _safe_int(row.get("likes", 0))
            comments = _safe_int(row.get("comments", 0))
            shares   = _safe_int(row.get("shares", 0))
            er       = engagement_rate(views, likes, comments, shares)

            rows.append({
                "url":      row.get("url", ""),
                "username": row.get("username", ""),
                "status":   row.get("status", ""),
                "views":    views,
                "likes":    likes,
                "comments": comments,
                "shares":   shares,
                "er":       er,
                "timestamp": row.get("timestamp", ""),
            })

    return rows


# ── HTML generation ───────────────────────────────────────────────────────────

def generate_html(rows: list[dict], keyword: str, log_path: str) -> str:
    """Build the full HTML report string."""

    ok_rows      = [r for r in rows if r["status"] == "ok"]
    total        = len(rows)
    downloaded   = len(ok_rows)
    total_views  = sum(r["views"] for r in ok_rows)
    total_likes  = sum(r["likes"] for r in ok_rows)
    avg_er       = round(sum(r["er"] for r in ok_rows) / downloaded, 2) if downloaded else 0.0

    title        = f"TikTok Report — {keyword}" if keyword else "TikTok Engagement Report"
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    # ── JSON data for client-side sort ────────────────────────────────────────
    json_data = json.dumps(rows, ensure_ascii=False)

    # ── Pre-rendered table rows (sorted by ER, highest first) ─────────────────
    sorted_rows = sorted(ok_rows, key=lambda x: x["er"], reverse=True)
    table_rows_html = ""
    for i, r in enumerate(sorted_rows, 1):
        css = er_class(r["er"])
        table_rows_html += f"""
            <tr>
              <td class="col-rank">#{i}</td>
              <td class="col-user"><a href="{r['url']}" target="_blank" rel="noopener">@{r['username'] or '—'}</a></td>
              <td class="col-num">{fmt_number(r['views'])}</td>
              <td class="col-num">{fmt_number(r['likes'])}</td>
              <td class="col-num">{fmt_number(r['comments'])}</td>
              <td class="col-num">{fmt_number(r['shares'])}</td>
              <td class="col-er"><span class="{css}">{r['er']:.2f}%</span></td>
              <td class="col-status {'s-ok' if r['status'] == 'ok' else 's-err'}">{r['status']}</td>
            </tr>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <style>
    /* ── Claude color theme ── */
    :root {{
      --bg:           #F5F0E8;
      --card:         #FFFFFF;
      --accent:       #DA7756;
      --accent-dk:    #B85E40;
      --accent-lt:    #F2DDD4;
      --text:         #2C2C2C;
      --muted:        #7A6E68;
      --border:       #E0D5CC;
      --stripe:       #FAF6F2;
      --shadow:       0 2px 12px rgba(180,100,70,.10);
      --green:        #2A7D4F;
      --green-bg:     #EAF5EE;
      --orange:       #C96A1A;
      --orange-bg:    #FEF3E6;
      --red:          #B83232;
      --red-bg:       #FDEAEA;
      --radius:       10px;
    }}

    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      padding: 2rem 1.5rem 4rem;
      max-width: 1200px;
      margin: 0 auto;
    }}

    /* ── Header ── */
    header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 3px solid var(--accent);
      padding-bottom: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: .5rem;
    }}
    header h1 {{
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: -.5px;
    }}
    header .meta {{
      font-size: .8rem;
      color: var(--muted);
      text-align: right;
    }}

    /* ── Summary cards ── */
    .cards {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }}
    .card {{
      background: var(--card);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow);
      border-left: 4px solid var(--accent);
    }}
    .card .label {{
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--muted);
      margin-bottom: .4rem;
    }}
    .card .value {{
      font-size: 2rem;
      font-weight: 800;
      color: var(--accent);
      line-height: 1.1;
    }}
    .card .sub {{
      font-size: .75rem;
      color: var(--muted);
      margin-top: .25rem;
    }}

    /* ── Sort bar ── */
    .sort-bar {{
      display: flex;
      align-items: center;
      gap: .5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }}
    .sort-bar .sort-label {{
      font-size: .82rem;
      font-weight: 600;
      color: var(--muted);
      margin-right: .25rem;
    }}
    .sort-btn {{
      background: var(--card);
      border: 1.5px solid var(--border);
      border-radius: 20px;
      padding: .35rem 1rem;
      font-size: .82rem;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
    }}
    .sort-btn:hover {{
      border-color: var(--accent);
      color: var(--accent);
    }}
    .sort-btn.active {{
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }}

    /* ── Table ── */
    .table-wrap {{
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: .88rem;
    }}
    thead th {{
      background: var(--accent);
      color: #fff;
      padding: .75rem 1rem;
      font-size: .78rem;
      font-weight: 700;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: .04em;
      white-space: nowrap;
    }}
    tbody tr {{
      border-bottom: 1px solid var(--border);
      transition: background .1s;
    }}
    tbody tr:last-child {{ border-bottom: none; }}
    tbody tr:hover {{ background: var(--stripe); }}
    td {{ padding: .65rem 1rem; vertical-align: middle; }}

    .col-rank  {{ color: var(--muted); font-size: .78rem; font-weight: 700; width: 52px; }}
    .col-user  {{ min-width: 140px; }}
    .col-user a {{ color: var(--accent-dk); text-decoration: none; font-weight: 600; }}
    .col-user a:hover {{ text-decoration: underline; }}
    .col-num   {{ text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }}
    .col-er    {{ text-align: center; }}
    .col-status {{ text-align: center; font-size: .78rem; font-weight: 700; }}

    /* Engagement rate badges */
    .er-green  {{ background: var(--green-bg);  color: var(--green);  padding: .2rem .7rem; border-radius: 20px; font-weight: 700; font-size: .82rem; }}
    .er-orange {{ background: var(--orange-bg); color: var(--orange); padding: .2rem .7rem; border-radius: 20px; font-weight: 700; font-size: .82rem; }}
    .er-red    {{ background: var(--red-bg);    color: var(--red);    padding: .2rem .7rem; border-radius: 20px; font-weight: 700; font-size: .82rem; }}

    .s-ok  {{ color: var(--green); }}
    .s-err {{ color: var(--red);   }}

    /* ── Legend ── */
    .legend {{
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
      font-size: .78rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }}
    .legend span {{ display: flex; align-items: center; gap: .35rem; }}

    /* ── Footer ── */
    footer {{
      margin-top: 2.5rem;
      font-size: .75rem;
      color: var(--muted);
      text-align: center;
    }}
    footer a {{ color: var(--accent); text-decoration: none; }}
    footer a:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>

<!-- Header -->
<header>
  <h1>📊 {title}</h1>
  <div class="meta">
    Generated: {generated_at}<br>
    Source: {Path(log_path).name} &nbsp;·&nbsp; {downloaded} of {total} videos
  </div>
</header>

<!-- Summary cards -->
<div class="cards">
  <div class="card">
    <div class="label">Videos Downloaded</div>
    <div class="value">{downloaded}</div>
    <div class="sub">of {total} total</div>
  </div>
  <div class="card">
    <div class="label">Total Views</div>
    <div class="value">{fmt_number(total_views)}</div>
    <div class="sub">across all videos</div>
  </div>
  <div class="card">
    <div class="label">Total Likes</div>
    <div class="value">{fmt_number(total_likes)}</div>
    <div class="sub">across all videos</div>
  </div>
  <div class="card">
    <div class="label">Avg Engagement Rate</div>
    <div class="value">{avg_er}%</div>
    <div class="sub">(likes + comments + shares) / views</div>
  </div>
</div>

<!-- Legend -->
<div class="legend">
  <span><span class="er-green">≥ 5%</span> High engagement</span>
  <span><span class="er-orange">2–5%</span> Medium engagement</span>
  <span><span class="er-red">&lt; 2%</span> Low engagement</span>
</div>

<!-- Sort controls -->
<div class="sort-bar">
  <span class="sort-label">Sort by:</span>
  <button class="sort-btn active" data-sort="er"       onclick="sortBy(this, 'er')">📈 Eng. Rate</button>
  <button class="sort-btn"        data-sort="views"    onclick="sortBy(this, 'views')">👁 Views</button>
  <button class="sort-btn"        data-sort="likes"    onclick="sortBy(this, 'likes')">❤️ Likes</button>
  <button class="sort-btn"        data-sort="comments" onclick="sortBy(this, 'comments')">💬 Comments</button>
  <button class="sort-btn"        data-sort="shares"   onclick="sortBy(this, 'shares')">🔁 Shares</button>
</div>

<!-- Table -->
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Creator</th>
        <th style="text-align:right">Views</th>
        <th style="text-align:right">Likes</th>
        <th style="text-align:right">Comments</th>
        <th style="text-align:right">Shares</th>
        <th style="text-align:center">Eng. Rate</th>
        <th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody id="tbody">
      {table_rows_html}
    </tbody>
  </table>
</div>

<!-- Footer -->
<footer>
  Generated by <a href="https://github.com/smdayone/tiktok-asset-hunter" target="_blank">tiktok-asset-hunter</a>
  &nbsp;·&nbsp; Engagement Rate = (Likes + Comments + Shares) / Views × 100
</footer>

<script>
  // ── Embedded data ──────────────────────────────────────────────────────────
  const ALL_ROWS = {json_data};

  // ── Utilities ──────────────────────────────────────────────────────────────
  function fmtNum(n) {{
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  }}

  function erClass(er) {{
    if (er >= 5) return "er-green";
    if (er >= 2) return "er-orange";
    return "er-red";
  }}

  // ── Render ─────────────────────────────────────────────────────────────────
  function renderRows(rows) {{
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = rows
      .filter(r => r.status === "ok")
      .map((r, i) => `
        <tr>
          <td class="col-rank">#${{i + 1}}</td>
          <td class="col-user"><a href="${{r.url}}" target="_blank" rel="noopener">@${{r.username || "—"}}</a></td>
          <td class="col-num">${{fmtNum(r.views)}}</td>
          <td class="col-num">${{fmtNum(r.likes)}}</td>
          <td class="col-num">${{fmtNum(r.comments)}}</td>
          <td class="col-num">${{fmtNum(r.shares)}}</td>
          <td class="col-er"><span class="${{erClass(r.er)}}">${{r.er.toFixed(2)}}%</span></td>
          <td class="col-status s-ok">ok</td>
        </tr>`).join("");
  }}

  // ── Sort ───────────────────────────────────────────────────────────────────
  function sortBy(btn, key) {{
    document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const sorted = [...ALL_ROWS].sort((a, b) => b[key] - a[key]);
    renderRows(sorted);
  }}

  // Initial render sorted by engagement rate
  renderRows([...ALL_ROWS].sort((a, b) => b.er - a.er));
</script>

</body>
</html>
"""


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate an HTML engagement report from download_log.csv."
    )
    parser.add_argument("--log",     required=True, help="Path to download_log.csv")
    parser.add_argument("--out",     required=True, help="Output path for the HTML report")
    parser.add_argument("--keyword", default="",    help="Keyword label shown in the report title")
    args = parser.parse_args()

    print(f"[i] Loading log: {args.log}")
    rows = load_log(args.log)
    print(f"[i] Rows loaded: {len(rows)} ({sum(1 for r in rows if r['status'] == 'ok')} successful)")

    html = generate_html(rows, keyword=args.keyword, log_path=args.log)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")

    print(f"[✓] Report saved: {out_path}")
    print(f"    Open in browser: file:///{out_path.resolve().as_posix()}")


if __name__ == "__main__":
    main()
