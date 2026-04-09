/**
 * TIKTOK URL COLLECTOR — Checkbox Edition
 * ─────────────────────────────────────────────────────────────────
 * How to use it:
 *
 * 1. Go to: tiktok.com/search/video?q=YOUR+KEYWORD  (Video tab)
 * 2. Open DevTools → Console (F12)
 * 3. Paste this script and press Enter
 * 4. Scroll the page — video cards appear in the side panel
 * 5. Check the videos you want to download
 * 6. Click "CSV" in the panel (or type downloadLinks() in console)
 * 7. Copy TikTokLinks.csv to links/queue/ and run run_download.ps1
 *
 * Console helpers:
 *   showStatus()     — log collection stats
 *   resetCollector() — clear everything and remove the UI
 * ─────────────────────────────────────────────────────────────────
 */

(function () {

  // ── State ─────────────────────────────────────────────────────────
  // all: Map<url, { username, videoId, thumb, checked, cardChk, panelChk }>
  window._ttCollector = window._ttCollector || { all: new Map(), interval: null };
  const state = window._ttCollector;

  if (state.interval) clearInterval(state.interval);

  // ── Inject CSS ────────────────────────────────────────────────────
  if (!document.getElementById("tt-styles")) {
    const s = document.createElement("style");
    s.id = "tt-styles";
    s.textContent = `
      #tt-panel {
        position: fixed; right: 16px; top: 80px;
        width: 272px; max-height: 72vh;
        background: #F5F0E8; border: 2px solid #DA7756;
        border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        z-index: 2147483647; font-family: -apple-system, "Segoe UI", sans-serif;
        font-size: 13px; color: #2C2C2C;
        display: flex; flex-direction: column; overflow: hidden;
      }
      #tt-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 14px; background: #DA7756; color: #fff;
        font-weight: 700; font-size: 13px; flex-shrink: 0;
      }
      #tt-count { font-size: 11px; opacity: .9; font-weight: 400; }
      #tt-actions {
        display: flex; gap: 6px; padding: 8px 10px;
        border-bottom: 1px solid #E0D5CC; flex-shrink: 0;
      }
      #tt-actions button {
        flex: 1; padding: 5px 0;
        border: 1.5px solid #DA7756; border-radius: 6px;
        background: #fff; color: #DA7756;
        font-size: 11px; font-weight: 700; cursor: pointer;
        transition: opacity .15s;
      }
      #tt-actions button:hover { opacity: .75; }
      #tt-btn-csv { background: #DA7756 !important; color: #fff !important; }
      #tt-list { overflow-y: auto; flex: 1; }
      #tt-empty {
        padding: 18px 14px; color: #999; font-size: 12px; text-align: center;
      }
      .tt-item {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 12px; border-bottom: 1px solid #F0E8E0;
        transition: background .1s;
      }
      .tt-item:hover { background: #FBF6F2; }
      .tt-item:last-child { border-bottom: none; }
      .tt-thumb {
        width: 36px; height: 48px; object-fit: cover;
        border-radius: 4px; background: #E0D5CC; flex-shrink: 0;
      }
      .tt-username {
        flex: 1; font-size: 12px; overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap;
      }
      .tt-card-lbl {
        position: absolute !important; top: 7px !important; left: 7px !important;
        z-index: 10000 !important; background: rgba(255,255,255,.88) !important;
        border-radius: 5px !important; padding: 3px !important;
        cursor: pointer !important; display: flex !important;
        box-shadow: 0 1px 4px rgba(0,0,0,.2) !important;
      }
      .tt-card-lbl input { width:18px; height:18px; cursor:pointer; accent-color:#DA7756; }
      .tt-panel-chk  { width:17px; height:17px; cursor:pointer; accent-color:#DA7756; flex-shrink:0; }
    `;
    document.head.appendChild(s);
  }

  // ── Panel ─────────────────────────────────────────────────────────
  function initPanel() {
    if (document.getElementById("tt-panel")) return;
    const p = document.createElement("div");
    p.id = "tt-panel";
    p.innerHTML = `
      <div id="tt-header">
        <span>TT Collector</span>
        <span id="tt-count">0 sel / 0</span>
      </div>
      <div id="tt-actions">
        <button id="tt-btn-all">All</button>
        <button id="tt-btn-none">Clear</button>
        <button id="tt-btn-csv">CSV ↓</button>
      </div>
      <div id="tt-list"><div id="tt-empty">Scroll to find videos...</div></div>
    `;
    document.body.appendChild(p);
    document.getElementById("tt-btn-all").addEventListener("click", () => setAll(true));
    document.getElementById("tt-btn-none").addEventListener("click", () => setAll(false));
    document.getElementById("tt-btn-csv").addEventListener("click", () => downloadLinks());
  }

  // ── Thumbnail extraction ──────────────────────────────────────────
  function extractThumb(card) {
    const anchor = card.querySelector('a[href*="/video/"]');
    if (anchor) {
      const bg = anchor.style.backgroundImage || "";
      const m  = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (m && m[1] && !m[1].startsWith("data:")) return m[1];
    }
    const img = card.querySelector("img[src]");
    if (img && img.src && !img.src.startsWith("data:")) return img.src;
    return null;
  }

  // ── Add item to panel ─────────────────────────────────────────────
  function addPanelItem(url, data) {
    const list = document.getElementById("tt-list");
    if (!list) return;
    const empty = document.getElementById("tt-empty");
    if (empty) empty.remove();

    const item = document.createElement("div");
    item.className = "tt-item";
    item.dataset.vid = data.videoId;

    if (data.thumb) {
      const img = document.createElement("img");
      img.className = "tt-thumb";
      img.src = data.thumb;
      img.alt = "";
      img.onerror = () => { img.style.background = "#E0D5CC"; img.removeAttribute("src"); };
      item.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "tt-thumb";
      item.appendChild(ph);
    }

    const name = document.createElement("span");
    name.className = "tt-username";
    name.textContent = `@${data.username || data.videoId}`;
    item.appendChild(name);

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "tt-panel-chk";
    chk.checked = data.checked;
    chk.addEventListener("change", () => setChecked(url, chk.checked));
    item.appendChild(chk);

    data.panelChk = chk;
    list.appendChild(item);
  }

  // ── Inject checkbox on card ───────────────────────────────────────
  function injectCardCheckbox(card, url) {
    if (card.querySelector(".tt-card-lbl")) return null;
    card.style.position = "relative";

    const lbl = document.createElement("label");
    lbl.className = "tt-card-lbl";
    lbl.addEventListener("click",  (e) => e.stopPropagation());

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = false;
    chk.addEventListener("change", (e) => { e.stopPropagation(); setChecked(url, chk.checked); });
    chk.addEventListener("click",  (e) => e.stopPropagation());

    lbl.appendChild(chk);
    card.appendChild(lbl);
    return chk;
  }

  // ── Set checked state (syncs card + panel) ────────────────────────
  function setChecked(url, value) {
    const data = state.all.get(url);
    if (!data) return;
    data.checked = value;
    if (data.cardChk)  data.cardChk.checked  = value;
    if (data.panelChk) data.panelChk.checked = value;
    updateCount();
  }

  function setAll(value) {
    state.all.forEach((data, url) => setChecked(url, value));
  }

  function updateCount() {
    const total    = state.all.size;
    const selected = [...state.all.values()].filter((d) => d.checked).length;
    const el = document.getElementById("tt-count");
    if (el) el.textContent = `${selected} sel / ${total}`;
  }

  // ── Collect new cards ─────────────────────────────────────────────
  function collectCards() {
    const cards = document.querySelectorAll('[data-e2e="search_top-item"]');
    let found = 0;

    cards.forEach((card) => {
      const anchor = card.querySelector('a[href*="/video/"]');
      if (!anchor) return;
      const url = anchor.href.split("?")[0];
      if (state.all.has(url)) return;

      const m        = url.match(/@([^/]+)\/video\/(\d+)/);
      const username = m ? m[1] : "";
      const videoId  = m ? m[2] : "";
      const thumb    = extractThumb(card);

      const data = { username, videoId, thumb, checked: false, cardChk: null, panelChk: null };
      state.all.set(url, data);

      data.cardChk = injectCardCheckbox(card, url);
      addPanelItem(url, data);
      found++;
    });

    if (found > 0) {
      updateCount();
      console.log(`[TT Collector] +${found} | Total: ${state.all.size}`);
    }

    if (cards.length === 0 && state.all.size === 0) {
      console.warn("[TT Collector] No search cards found. Are you on tiktok.com/search/video?q=KEYWORD?");
    }
  }

  // ── Init ──────────────────────────────────────────────────────────
  initPanel();
  collectCards();
  state.interval = setInterval(collectCards, 800);

  console.log("%c[TT Collector] Started", "color:#DA7756;font-weight:bold;font-size:14px");
  console.log("%cScroll the page. Check videos in the panel, then click CSV.", "color:#888;font-size:12px");

  // ── Public API ────────────────────────────────────────────────────
  window.downloadLinks = function () {
    const selected = [...state.all.entries()].filter(([, d]) => d.checked);
    if (selected.length === 0) {
      console.warn("[TT Collector] No videos selected. Use the checkboxes in the panel first.");
      return;
    }
    const rows = ["url,username,video_id"];
    for (const [url, d] of selected) {
      rows.push(`${url},${d.username},${d.videoId}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "TikTokLinks.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    console.log(`%c[TT Collector] Saved: ${selected.length} videos → TikTokLinks.csv`, "color:#30d158;font-weight:bold");
  };

  window.showStatus = function () {
    const total    = state.all.size;
    const selected = [...state.all.values()].filter((d) => d.checked).length;
    console.log(`%c[TT Collector] ${selected} selected / ${total} found`, "color:#DA7756;font-weight:bold");
    [...state.all.entries()].filter(([, d]) => d.checked).slice(0, 3)
      .forEach(([url]) => console.log("  ", url));
  };

  window.resetCollector = function () {
    if (state.interval) clearInterval(state.interval);
    state.all.clear();
    ["tt-panel", "tt-styles"].forEach((id) => document.getElementById(id)?.remove());
    document.querySelectorAll(".tt-card-lbl").forEach((el) => el.remove());
    console.log("[TT Collector] Reset. Re-run the script to restart.");
  };

})();
