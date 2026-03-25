/**
 * Trust / Permissions Layer — from KB doc #602.
 *
 * "Power without trust kills adoption."
 * Explicit controls from day 1: view, suggest, assist, action modes.
 * Default: VIEW_ONLY (privacy-first, per Codex + Gemini review feedback).
 */

const TrustLevel = Object.freeze({
  VIEW_ONLY: 'view_only',       // just apply themes, no data capture
  SUGGEST: 'suggest',           // capture signals, show suggestions
  ASSIST: 'assist',             // agent can reorder/hide/summarize
  ACTION: 'action'              // agent can perform actions (click, fill, navigate)
});

const VALID_TRUST_LEVELS = new Set(Object.values(TrustLevel));

class TrustManager {
  constructor() {
    this.globalLevel = TrustLevel.VIEW_ONLY;  // privacy-first default
    this.siteOverrides = {};
    this.siteEnabled = {};       // per-site enable/disable
    this.dataCollection = false; // off by default until user opts in
    this.memoryEnabled = false;  // off by default until user opts in
    this.onboarded = false;      // tracks whether user has completed onboarding
    this._loaded = false;
  }

  async load() {
    if (this._loaded) return;
    return new Promise((resolve) => {
      chrome.storage.local.get(['trust_config'], (data) => {
        if (data.trust_config) {
          Object.assign(this, data.trust_config);
        }
        this._loaded = true;
        resolve();
      });
    });
  }

  async save() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        trust_config: {
          globalLevel: this.globalLevel,
          siteOverrides: this.siteOverrides,
          siteEnabled: this.siteEnabled,
          dataCollection: this.dataCollection,
          memoryEnabled: this.memoryEnabled,
          onboarded: this.onboarded
        }
      }, resolve);
    });
  }

  // Get effective trust level for a site
  getLevelFor(hostname) {
    return this.siteOverrides[hostname] || this.globalLevel;
  }

  // Check if extension is enabled for a site
  isEnabledFor(hostname) {
    if (this.siteEnabled[hostname] !== undefined) {
      return this.siteEnabled[hostname];
    }
    return true; // enabled globally by default
  }

  // Check if an action is allowed
  canDo(action, hostname) {
    if (!this.isEnabledFor(hostname)) return false;

    const level = this.getLevelFor(hostname);
    switch (action) {
      case 'theme':      return true;
      case 'capture':    return this.dataCollection && level !== TrustLevel.VIEW_ONLY;
      case 'suggest':    return level === TrustLevel.SUGGEST || level === TrustLevel.ASSIST || level === TrustLevel.ACTION;
      case 'reorder':    return level === TrustLevel.ASSIST || level === TrustLevel.ACTION;
      case 'hide':       return level === TrustLevel.ASSIST || level === TrustLevel.ACTION;
      case 'act':        return level === TrustLevel.ACTION;
      default:           return false;
    }
  }

  async setSiteLevel(hostname, level) {
    // Validate trust level
    if (!VALID_TRUST_LEVELS.has(level)) return;
    this.siteOverrides[hostname] = level;
    // Enable data collection if user explicitly chooses suggest+
    if (level !== TrustLevel.VIEW_ONLY) {
      this.dataCollection = true;
      this.memoryEnabled = true;
    }
    await this.save();
  }

  async setSiteEnabled(hostname, enabled) {
    this.siteEnabled[hostname] = !!enabled;
    await this.save();
  }

  // Export user data (GDPR-ready) — only export user-facing fields
  async exportProfile() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['taste_long', 'trust_config'], (data) => {
        resolve(JSON.stringify({
          preferences: data.taste_long || {},
          trustConfig: data.trust_config || {},
          exportedAt: new Date().toISOString()
        }, null, 2));
      });
    });
  }

  // Delete all stored data
  async deleteAllData() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }
}

if (typeof window !== 'undefined') {
  window.MemstalkerTrust = { TrustLevel, TrustManager, VALID_TRUST_LEVELS };
}
