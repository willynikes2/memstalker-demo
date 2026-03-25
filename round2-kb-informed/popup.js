/**
 * Popup controller — talks to content script via chrome.tabs.sendMessage.
 * Reads current state, displays it, sends updates back.
 *
 * Fixes applied from Codex (security) + Gemini (UX) reviews:
 * - aria-pressed on all button groups
 * - Trust level descriptions
 * - Inline delete confirmation (no confirm() dialog)
 * - Controls disabled when extension is off
 * - Font size value readout
 * - Human-readable page type labels
 */

const schemeButtons = document.querySelectorAll('.theme-btn');
const layoutButtons = document.querySelectorAll('.layout-btn');
const densityButtons = document.querySelectorAll('.density-btn');
const trustButtons = document.querySelectorAll('.trust-btn');
const enabledToggle = document.getElementById('enabled');
const memoryToggle = document.getElementById('memoryToggle');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const siteBadge = document.getElementById('siteBadge');
const pageInfo = document.getElementById('pageInfo');
const entityCount = document.getElementById('entityCount');
const exportBtn = document.getElementById('exportBtn');
const deleteBtn = document.getElementById('deleteBtn');
const confirmDelete = document.getElementById('confirmDelete');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const trustDesc = document.getElementById('trustDesc');
const controlsWrapper = document.getElementById('controlsWrapper');

const TRUST_DESCRIPTIONS = {
  view_only: 'Theme only. No data collected.',
  suggest: 'Learns preferences. Suggests improvements.',
  assist: 'Can reorder, hide noise, and summarize content.',
  action: 'Full agent control: click, fill forms, navigate.'
};

const PAGE_TYPE_LABELS = {
  feed: 'News feed',
  product_list: 'Product listing',
  product_detail: 'Product page',
  article: 'Article',
  video: 'Video page',
  forum_thread: 'Forum thread',
  search_results: 'Search results',
  unknown: 'Unsupported page'
};

let currentTab = null;

// Get current state from content script
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentTab = tabs[0];
  if (!currentTab) return;

  chrome.tabs.sendMessage(currentTab.id, { type: 'getState' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      siteBadge.textContent = 'not active';
      siteBadge.classList.add('error');
      pageInfo.textContent = 'Memstalker is not active on this page.';
      updateControlsState(false);
      return;
    }

    siteBadge.textContent = response.hostname.slice(0, 60);
    const label = PAGE_TYPE_LABELS[response.pageType] || response.pageType;
    pageInfo.textContent = `${label} \u2022 ${response.entityCount} items detected`;
    entityCount.textContent = `${response.entityCount} items`;

    // Set active buttons from current preferences
    setActive(schemeButtons, 'scheme', response.prefs.colorScheme);
    setActive(layoutButtons, 'layout', response.prefs.layoutStyle);
    setActive(densityButtons, 'density', response.prefs.visualDensity);
    setActive(trustButtons, 'trust', response.trustLevel);
    fontSizeSlider.value = response.prefs.fontSize || 100;
    fontSizeValue.textContent = (response.prefs.fontSize || 100) + '%';

    enabledToggle.checked = response.enabled !== false;
    memoryToggle.checked = response.memoryEnabled === true;
    trustDesc.textContent = TRUST_DESCRIPTIONS[response.trustLevel] || '';
    updateControlsState(enabledToggle.checked);
  });
});

function setActive(buttons, attr, value) {
  buttons.forEach(btn => {
    const isActive = btn.dataset[attr] === value;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function updateControlsState(enabled) {
  controlsWrapper.classList.toggle('controls-disabled', !enabled);
}

function sendUpdate(updates) {
  if (!currentTab) return;
  chrome.tabs.sendMessage(currentTab.id, { type: 'applyTheme', ...updates });
}

// Color scheme
schemeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setActive(schemeButtons, 'scheme', btn.dataset.scheme);
    sendUpdate({ colorScheme: btn.dataset.scheme });
  });
});

// Layout
layoutButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setActive(layoutButtons, 'layout', btn.dataset.layout);
    sendUpdate({ layoutStyle: btn.dataset.layout });
  });
});

// Density
densityButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setActive(densityButtons, 'density', btn.dataset.density);
    sendUpdate({ visualDensity: btn.dataset.density });
  });
});

// Trust level — wired to real setSiteLevel (Codex fix)
trustButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setActive(trustButtons, 'trust', btn.dataset.trust);
    trustDesc.textContent = TRUST_DESCRIPTIONS[btn.dataset.trust] || '';
    chrome.tabs.sendMessage(currentTab.id, { type: 'setTrustLevel', level: btn.dataset.trust });
  });
});

// Font size with value readout
fontSizeSlider.addEventListener('input', () => {
  fontSizeValue.textContent = fontSizeSlider.value + '%';
  sendUpdate({ fontSize: parseInt(fontSizeSlider.value) });
});

// Enable toggle — wires to real setEnabled (Codex fix)
enabledToggle.addEventListener('change', () => {
  const enabled = enabledToggle.checked;
  updateControlsState(enabled);
  chrome.tabs.sendMessage(currentTab.id, { type: 'setEnabled', enabled });
});

// Memory toggle — wires to real setMemoryEnabled
memoryToggle.addEventListener('change', () => {
  chrome.tabs.sendMessage(currentTab.id, { type: 'setMemoryEnabled', enabled: memoryToggle.checked });
});

// Export — scoped to preferences only (Codex fix)
exportBtn.addEventListener('click', () => {
  chrome.tabs.sendMessage(currentTab.id, { type: 'exportData' }, (response) => {
    if (response?.data) {
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      chrome.downloads?.download({ url, filename: `memstalker-profile-${ts}.json` });
    }
  });
});

// Delete — inline confirmation (Gemini fix: no confirm() dialog)
deleteBtn.addEventListener('click', () => {
  confirmDelete.classList.toggle('visible');
});

confirmDeleteBtn.addEventListener('click', () => {
  chrome.tabs.sendMessage(currentTab.id, { type: 'deleteData' }, () => {
    window.close();
  });
});
