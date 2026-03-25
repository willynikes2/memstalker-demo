// Background service worker — manages preference learning

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    theme: 'dark',
    enabled: true,
    fontSize: 100,
    contrast: 100,
    siteCount: 0,
    siteHistory: {}
  });
});

// Simple preference learning: track which themes are used most per domain
chrome.storage.onChanged.addListener((changes) => {
  if (changes.siteHistory) {
    // Could analyze patterns here for auto-theming
    // For now, just persist the history
  }
});
