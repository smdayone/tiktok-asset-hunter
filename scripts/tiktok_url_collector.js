/**
 * TIKTOK URL COLLECTOR
 * ─────────────────────────────────────────────────────────────────
 * How to use it:
 *
 * 1. Go to: tiktok.com/search/video?q=YOUR+KEYWORD  (video tab)
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
 * Optional: to check collection status at any time:
 *        showStatus()
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  // Internal state
  window._ttCollector = window._ttCollector || {
    links: new Set(),
    interval: null,
  };

  const state = window._ttCollector;

  // Stop any previous collector instance
  if (state.interval) {
    clearInterval(state.interval);
  }

  // ── Core collection logic ─────────────────────────────────────────
  //
  // Strategy: query ONLY [data-e2e="search_top-item"] elements.
  // Each one is a single search-result video card. We take the first
  // /video/ link inside it. This filters out:
  //   - "Following" feed videos shown above the results
  //   - Sidebar / recommended content
  //   - Hashtag links and user profile links
  //
  function collectLinks() {
    const cards = document.querySelectorAll('[data-e2e="search_top-item"]');
    let found = 0;

    cards.forEach((card) => {
      // First anchor with a /video/ path inside this search-result card
      const anchor = card.querySelector('a[href*="/video/"]');
      if (!anchor) return;

      const href = anchor.href.split("?")[0]; // strip query params
      if (href && !state.links.has(href)) {
        state.links.add(href);
        found++;
      }
    });

    if (found > 0) {
      console.log(
        `[TT Collector] +${found} new links | Total: ${state.links.size}`
      );
    }

    // Warn if no search_top-item cards found at all
    if (cards.length === 0 && state.links.size === 0) {
      console.warn(
        "[TT Collector] No search result cards found. " +
        "Make sure you are on: tiktok.com/search/video?q=YOUR+KEYWORD"
      );
    }
  }

  // Collect every 800ms while scrolling
  state.interval = setInterval(collectLinks, 800);

  // First immediate collection
  collectLinks();

  console.log(
    "%c[TT Collector] Started - search results only",
    "color: #DA7756; font-weight: bold; font-size: 14px"
  );
  console.log(
    "%cSCROLL the page. When done type: downloadLinks()",
    "color: #888; font-size: 12px"
  );

  // ── Status helper ─────────────────────────────────────────────────
  window.showStatus = function () {
    const cards = document.querySelectorAll('[data-e2e="search_top-item"]');
    console.log(
      `%c[TT Collector] ${state.links.size} links collected | ${cards.length} cards visible`,
      "color: #DA7756; font-weight: bold"
    );
    if (state.links.size > 0) {
      console.log("Sample URLs:");
      [...state.links].slice(0, 3).forEach((u) => console.log(" ", u));
    }
  };

  // ── Download file ─────────────────────────────────────────────────
  window.downloadLinks = function (partial = false) {
    if (state.links.size === 0) {
      console.warn(
        "[TT Collector] No links found yet. Have you scrolled the page?"
      );
      return;
    }

    if (!partial && state.interval) {
      clearInterval(state.interval);
      state.interval = null;
      console.log("[TT Collector] Collection stopped.");
    }

    const blob = new Blob([[...state.links].join("\n"), { type: "text/plain" }]);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = partial ? "TikTokLinks_partial.txt" : "TikTokLinks.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(
      `%c[TT Collector] Saved: ${state.links.size} links → ${a.download}`,
      "color: #30d158; font-weight: bold"
    );
  };

  // Reset function
  window.resetCollector = function () {
    if (state.interval) clearInterval(state.interval);
    state.links.clear();
    console.log("[TT Collector] Reset. Re-run the script to restart.");
  };
})();
