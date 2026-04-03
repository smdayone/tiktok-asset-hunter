/**
 * TIKTOK URL COLLECTOR
 * ─────────────────────────────────────────────────────────────────
 * How to use it:
 *
 * 1. Go to tiktok.com/search/video?q=YOUR+KEYWORD (video tab)
 * 2. Open DevTools → Console (F12 or Cmd+Option+I)
 * 3. Paste this script and press Enter
 * 4. Scroll the page manually — the script collects links in the background
 * 5. When you are done scrolling, type in the console:
 *        downloadLinks()
 *    and press Enter → TikTokLinks.txt will be downloaded
 * 6. Use that file with tiktok_batch_download.py
 *
 * Optional: to download a partial file while still scrolling:
 *        downloadLinks(true)
 *
 * Optional: to see how many links are collected so far:
 *        showStatus()
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  // Internal state
  window._ttCollector = window._ttCollector || {
    links: new Set(),
    interval: null,
    count: 0,
    mode: "unknown",
  };

  const state = window._ttCollector;

  // Stop any previous collector
  if (state.interval) {
    clearInterval(state.interval);
  }

  // ── Container detection (scoped collection) ───────────────────────
  // Try to find the search results feed container first.
  // This prevents collecting sidebar / recommended / unrelated videos.
  const CONTAINER_SELECTORS = [
    // TikTok search results feed (video tab)
    '[data-e2e="search_top-item-list"]',
    '[data-e2e="search-item-list"]',
    '[data-e2e="search_video-item-list"]',
    // Generic main feed wrappers
    '[class*="DivVideoFeed"]',
    '[class*="search-card-container"]',
    // Last resort: main content area
    'main',
    '#main-content',
  ];

  function findContainer() {
    for (const sel of CONTAINER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return document; // fallback: full page
  }

  // ── TikTok video link selectors ───────────────────────────────────
  const VIDEO_SELECTORS = [
    'a[href*="/video/"]',
    'a[href*="/@"][href*="/video"]',
  ];

  function collectLinks() {
    const container = findContainer();
    const isScoped  = container !== document;

    if (state.mode !== (isScoped ? "scoped" : "full")) {
      state.mode = isScoped ? "scoped" : "full";
      const label = isScoped
        ? `[TT Collector] Scoped to: ${container.tagName}[data-e2e="${container.dataset.e2e || ''}"]`
        : "[TT Collector] WARNING: no search container found — collecting full page";
      console.log(`%c${label}`, "color: #DA7756; font-size: 11px");
    }

    let found = 0;
    VIDEO_SELECTORS.forEach((sel) => {
      container.querySelectorAll(sel).forEach((el) => {
        const href = el.href;
        // Extra guard: skip profile links that happen to contain /video/
        if (
          href &&
          href.includes("/video/") &&
          !href.includes("/video/#") &&
          !state.links.has(href)
        ) {
          state.links.add(href);
          found++;
        }
      });
    });

    if (found > 0) {
      state.count += found;
      console.log(`[TT Collector] +${found} new links | Total: ${state.links.size}`);
    }
  }

  // Collect every 800ms while scrolling
  state.interval = setInterval(collectLinks, 800);

  // First immediate collection
  collectLinks();

  console.log(
    "%c[TT Collector] Started ✓",
    "color: #DA7756; font-weight: bold; font-size: 14px"
  );
  console.log(
    "%cTip: make sure you are on tiktok.com/search/video?q=YOUR+KEYWORD",
    "color: #e09060; font-size: 12px"
  );
  console.log(
    "%cSCROLL the page. When done, type: downloadLinks()",
    "color: #888; font-size: 12px"
  );

  // ── Status ────────────────────────────────────────────────────────
  window.showStatus = function () {
    const container = findContainer();
    const isScoped  = container !== document;
    console.log(
      `%c[TT Collector] ${state.links.size} links collected | mode: ${isScoped ? "scoped ✓" : "full page ⚠"}`,
      "color: #DA7756; font-weight: bold"
    );
    console.log([...state.links].slice(0, 3).join("\n"));
  };

  // ── Download file ─────────────────────────────────────────────────
  window.downloadLinks = function (partial = false) {
    if (state.links.size === 0) {
      console.warn("[TT Collector] No links found. Have you scrolled the page yet?");
      return;
    }

    // Stop collection (only if not partial)
    if (!partial && state.interval) {
      clearInterval(state.interval);
      state.interval = null;
      console.log("[TT Collector] Collection stopped.");
    }

    const lines = [...state.links].join("\n");
    const blob  = new Blob([lines], { type: "text/plain" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = partial ? "TikTokLinks_partial.txt" : "TikTokLinks.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(
      `%c[TT Collector] Downloaded: ${state.links.size} links → ${a.download}`,
      "color: #30d158; font-weight: bold;"
    );
  };

  // Reset function
  window.resetCollector = function () {
    if (state.interval) clearInterval(state.interval);
    state.links.clear();
    state.count = 0;
    state.mode  = "unknown";
    console.log("[TT Collector] Reset. Re-run the script to restart.");
  };
})();
