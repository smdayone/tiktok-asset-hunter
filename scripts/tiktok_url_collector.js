/**
 * TIKTOK URL COLLECTOR
 * ─────────────────────────────────────────────────────────────────
 * Come usarlo:
 *
 * 1. Vai su tiktok.com e cerca la tua keyword (es. "wireless earbuds")
 * 2. Apri DevTools → Console (F12 o Cmd+Option+I)
 * 3. Incolla questo script e premi Invio
 * 4. Scorri manualmente la pagina — lo script raccoglie i link in background
 * 5. Quando hai finito di scorrere, digita nella console:
 *        downloadLinks()
 *    e premi Invio → verrà scaricato il file TikTokLinks.txt
 * 6. Usa quel file con tiktok_batch_download.py
 *
 * Opzionale: per scaricare un file parziale mentre scorri ancora:
 *        downloadLinks(true)
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  // Stato interno
  window._ttCollector = window._ttCollector || {
    links: new Set(),
    interval: null,
    count: 0,
  };

  const state = window._ttCollector;

  // Stoppa eventuale collector precedente
  if (state.interval) {
    clearInterval(state.interval);
  }

  // ── Selettori TikTok (aggiornati a Q1 2026) ──────────────────────
  const VIDEO_SELECTORS = [
    'a[href*="/video/"]',           // link video standard
    'a[href*="/@"][href*="/video"]', // link con username
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
      console.log(`[TT Collector] +${found} nuovi link | Totale: ${state.links.size}`);
    }
  }

  // Raccolta ogni 800ms mentre scorri
  state.interval = setInterval(collectLinks, 800);

  // Prima raccolta immediata
  collectLinks();

  console.log(
    "%c[TT Collector] Avviato ✓",
    "color: #0A84FF; font-weight: bold; font-size: 14px"
  );
  console.log(
    "%cSCORRI la pagina. Quando hai finito digita: downloadLinks()",
    "color: #888; font-size: 12px"
  );

  // ── Download file ─────────────────────────────────────────────────
  window.downloadLinks = function (partial = false) {
    if (state.links.size === 0) {
      console.warn("[TT Collector] Nessun link trovato. Hai già scorso la pagina?");
      return;
    }

    // Ferma la raccolta (solo se non è parziale)
    if (!partial && state.interval) {
      clearInterval(state.interval);
      state.interval = null;
      console.log("[TT Collector] Raccolta fermata.");
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
      `%c[TT Collector] Scaricato: ${state.links.size} link → ${a.download}`,
      "color: #30d158; font-weight: bold;"
    );
  };

  // Funzione di reset
  window.resetCollector = function () {
    if (state.interval) clearInterval(state.interval);
    state.links.clear();
    state.count = 0;
    console.log("[TT Collector] Reset. Riavvia con lo script.");
  };
})();
