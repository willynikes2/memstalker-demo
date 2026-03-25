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

  // Check if an action is allowed — derives capture consent from per-site trust level
  canDo(action, hostname) {
    if (!this.isEnabledFor(hostname)) return false;

    const level = this.getLevelFor(hostname);
    switch (action) {
      case 'theme':      return true;
      case 'capture':    return level !== TrustLevel.VIEW_ONLY; // derived from site trust, not global flag
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
    // No longer mutates global state — consent is per-site via trust level
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

  // Delete data for a specific site only
  async deleteSiteData(hostname) {
    delete this.siteOverrides[hostname];
    delete this.siteEnabled[hostname];
    // Remove site-specific taste rules
    return new Promise((resolve) => {
      chrome.storage.local.get(['taste_long'], (data) => {
        const tasteLong = data.taste_long || {};
        if (tasteLong.siteRules) {
          delete tasteLong.siteRules[hostname];
        }
        chrome.storage.local.set({ taste_long: tasteLong }, async () => {
          await this.save();
          resolve();
        });
      });
    });
  }

  // Delete ALL stored data globally
  async deleteAllData() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }
}

if (typeof window !== 'undefined') {
  window.MemstalkerTrust = { TrustLevel, TrustManager, VALID_TRUST_LEVELS };
}
