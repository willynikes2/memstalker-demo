// Content script — applies themes to the page

function applyTheme(settings) {
  const html = document.documentElement;

  if (!settings.enabled) {
    html.removeAttribute('data-wt-theme');
    html.style.removeProperty('font-size');
    html.style.removeProperty('filter');
    return;
  }

  // Apply theme
  html.setAttribute('data-wt-theme', settings.theme || 'dark');

  // Apply font size scaling
  if (settings.fontSize && settings.fontSize !== 100) {
    html.style.fontSize = settings.fontSize + '%';
  } else {
    html.style.removeProperty('font-size');
  }

  // Apply contrast on top of theme filter
  if (settings.contrast && settings.contrast !== 100) {
    const existing = getComputedStyle(html).filter;
    if (existing && existing !== 'none') {
      html.style.filter = existing.replace(/contrast\([^)]*\)/, '') + ` contrast(${settings.contrast / 100})`;
    } else {
      html.style.filter = `contrast(${settings.contrast / 100})`;
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'applyTheme') {
    applyTheme(msg);
  }
});

// Apply saved theme on page load
chrome.storage.local.get(['theme', 'enabled', 'fontSize', 'contrast'], (data) => {
  if (data.enabled !== false) {
    applyTheme({
      theme: data.theme || 'dark',
      enabled: data.enabled !== false,
      fontSize: data.fontSize || 100,
      contrast: data.contrast || 100
    });
  }
});

// Track site usage for preference learning
(function trackUsage() {
  const host = location.hostname;
  chrome.storage.local.get(['siteCount', 'siteHistory'], (data) => {
    const count = (data.siteCount || 0) + 1;
    const history = data.siteHistory || {};
    history[host] = (history[host] || 0) + 1;
    chrome.storage.local.set({ siteCount: count, siteHistory: history });
  });
})();
