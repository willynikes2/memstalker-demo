const themeButtons = document.querySelectorAll('.theme-btn');
const enabledToggle = document.getElementById('enabled');
const fontSizeSlider = document.getElementById('fontSize');
const contrastSlider = document.getElementById('contrast');
const statsEl = document.getElementById('stats');

// Load saved preferences
chrome.storage.local.get(['theme', 'enabled', 'fontSize', 'contrast', 'siteCount'], (data) => {
  if (data.theme) {
    setActiveButton(data.theme);
  }
  if (data.enabled !== undefined) {
    enabledToggle.checked = data.enabled;
  }
  if (data.fontSize) {
    fontSizeSlider.value = data.fontSize;
  }
  if (data.contrast) {
    contrastSlider.value = data.contrast;
  }
  statsEl.textContent = `Sites themed: ${data.siteCount || 0}`;
});

function setActiveButton(theme) {
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function applySettings() {
  const activeBtn = document.querySelector('.theme-btn.active');
  const settings = {
    theme: activeBtn ? activeBtn.dataset.theme : 'dark',
    enabled: enabledToggle.checked,
    fontSize: parseInt(fontSizeSlider.value),
    contrast: parseInt(contrastSlider.value)
  };

  chrome.storage.local.set(settings);

  // Send to active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'applyTheme', ...settings });
    }
  });
}

themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveButton(btn.dataset.theme);
    applySettings();
  });
});

enabledToggle.addEventListener('change', applySettings);
fontSizeSlider.addEventListener('input', applySettings);
contrastSlider.addEventListener('input', applySettings);
