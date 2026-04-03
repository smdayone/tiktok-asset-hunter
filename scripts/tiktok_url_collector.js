/**
 * TIKTOK URL COLLECTOR
 * ─────────────────────────────────────────────────────────────────
 * How to use it:
 *
 * 1. Go to tiktok.com and search for your keyword (e.g. "wireless earbuds")
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
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  // Internal state
  window._ttCollector = window._ttCollector || {
    links: new Set(),
    interval: null,
    count: 0,
  };

  const state = window._ttCollector;

  // Stop any previous collector
  if (state.interval) {
    clearInterval(state.interval);
  }

  // ── TikTok selectors (updated Q1 2026) ───────────────────────────
  const VIDEO_SELECTORS = [
    'a[href*="/video/"]',           // standard video link
    'a[href*="/@"][href*="/video"]', // link with username
  ];

  function collectLinks() {
    let found = 0;
    VIDEO_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const href = el.href;
        if (href && href.includes("/video/") && !state.links.has(href)) {
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
    "%cSCROLL the page. When done, type: downloadLinks()",
    "color: #888; font-size: 12px"
  );

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
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = partial ? "TikTokLinks_partial.txt" : "TikTokLinks.txt";
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
    console.log("[TT Collector] Reset. Re-run the script to restart.");
  };
})();
