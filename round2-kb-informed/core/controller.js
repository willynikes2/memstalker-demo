/**
 * Controller — orchestrates adapter -> page model -> taste -> transformer.
 *
 * This is the main entry point for each page load.
 * Follows KB architecture: detect site -> normalize -> apply preferences -> capture signals.
 */

(async function MemstalkerController() {
  'use strict';

  const { PageType, PageModel, PageEntity } = window.MemstalkerPageModel;
  const TasteGraph = window.MemstalkerTaste;
  const { TrustLevel, TrustManager } = window.MemstalkerTrust;
  const Transformer = window.MemstalkerTransformer;

  // Initialize core systems
  const taste = new TasteGraph();
  const trust = new TrustManager();
  await Promise.all([taste.load(), trust.load()]);

  const hostname = location.hostname;
  const transformer = new Transformer(taste, trust);

  // Check if extension is enabled for this site
  if (!trust.isEnabledFor(hostname)) return;

  // Get page model from adapter (adapter sets window.MemstalkerAdapter)
  let pageModel;
  if (window.MemstalkerAdapter && typeof window.MemstalkerAdapter.parse === 'function') {
    pageModel = window.MemstalkerAdapter.parse();
  } else {
    pageModel = new PageModel(PageType.UNKNOWN);
  }

  // Apply theming + transforms
  await transformer.apply(pageModel);

  // Capture preference signals (only if trusted AND memory enabled)
  if (trust.canDo('capture', hostname) && trust.memoryEnabled) {
    captureSignals(taste, trust, hostname);
  }

  // Listen for popup messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Validate sender — only accept from our own extension
    const isExtension = sender.id === chrome.runtime.id;
    if (!isExtension) return;

    // Sensitive operations: only from popup (extension pages)
    const isPopup = sender.url?.startsWith('chrome-extension://');

    if (msg.type === 'applyTheme') {
      handlePopupMessage(msg, taste, trust, transformer, pageModel);
      sendResponse({ ok: true });
    } else if (msg.type === 'getState') {
      sendResponse({
        hostname,
        prefs: taste.getPreferences(hostname),
        trustLevel: trust.getLevelFor(hostname),
        enabled: trust.isEnabledFor(hostname),
        memoryEnabled: trust.memoryEnabled,
        dataCollection: trust.dataCollection,
        pageType: pageModel.type,
        entityCount: pageModel.entities.length
      });
    } else if (msg.type === 'exportData') {
      if (!isPopup) { sendResponse({ error: 'unauthorized' }); return; }
      trust.exportProfile().then(data => sendResponse({ data }));
      return true; // async response
    } else if (msg.type === 'deleteData') {
      if (!isPopup) { sendResponse({ error: 'unauthorized' }); return; }
      trust.deleteAllData().then(() => sendResponse({ ok: true }));
      return true;
    } else if (msg.type === 'setTrustLevel') {
      if (!isPopup) { sendResponse({ error: 'unauthorized' }); return; }
      trust.setSiteLevel(hostname, msg.level).then(() => sendResponse({ ok: true }));
      return true;
    } else if (msg.type === 'setEnabled') {
      if (!isPopup) { sendResponse({ error: 'unauthorized' }); return; }
      trust.setSiteEnabled(hostname, msg.enabled).then(() => {
        if (!msg.enabled) {
          // Remove theming attributes
          document.documentElement.removeAttribute('data-memstalker');
          document.documentElement.removeAttribute('data-ms-scheme');
          document.documentElement.removeAttribute('data-ms-density');
          document.documentElement.removeAttribute('data-ms-layout');
        } else {
          transformer.apply(pageModel);
        }
        sendResponse({ ok: true });
      });
      return true;
    } else if (msg.type === 'setMemoryEnabled') {
      if (!isPopup) { sendResponse({ error: 'unauthorized' }); return; }
      trust.memoryEnabled = msg.enabled;
      trust.save().then(() => sendResponse({ ok: true }));
      return true;
    }
  });

  function handlePopupMessage(msg, taste, trust, transformer, pageModel) {
    // Record signals for taste learning (only if memory enabled)
    if (trust.memoryEnabled && trust.canDo('capture', hostname)) {
      if (msg.colorScheme) {
        taste.recordSignal({ type: 'color_scheme', hostname, value: msg.colorScheme });
      }
      if (msg.layoutStyle) {
        taste.recordSignal({ type: 'layout_choice', hostname, value: msg.layoutStyle });
      }
      if (msg.visualDensity) {
        taste.recordSignal({ type: 'density_choice', hostname, value: msg.visualDensity });
      }
    }

    // Re-apply with new preferences
    transformer.apply(pageModel);
  }

  function captureSignals(taste, trust, hostname) {
    // Track dwell time
    let dwellStart = Date.now();
    window.addEventListener('beforeunload', () => {
      if (!trust.memoryEnabled) return;
      const dwellMs = Date.now() - dwellStart;
      if (dwellMs > 5000) {
        taste.recordSignal({
          type: 'dwell_time',
          hostname,
          value: Math.round(dwellMs / 1000),
          strength: Math.min(dwellMs / 60000, 1)
        });
      }
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const pct = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      maxScroll = Math.max(maxScroll, pct);
    }, { passive: true });

    window.addEventListener('beforeunload', () => {
      if (!trust.memoryEnabled) return;
      if (maxScroll > 25) {
        taste.recordSignal({
          type: 'scroll_depth',
          hostname,
          value: maxScroll,
          strength: maxScroll / 100
        });
      }
    });
  }
})();
