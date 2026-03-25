/**
 * Taste Graph — 3-tier memory system from KB doc #602.
 *
 * Hot:  current tab/session intent
 * Warm: recent history, active tasks, temporary preferences
 * Long: durable taste graph, learned patterns, saved automations
 *
 * The taste graph is the moat — it compounds across sessions and sites.
 */

class TasteGraph {
  constructor() {
    this.hot = {};    // session-only, never persisted
    this.warm = {};   // persisted, decays over days
    this.long = {};   // permanent learned preferences
    this._loaded = false;
  }

  async load() {
    if (this._loaded) return;
    return new Promise((resolve) => {
      chrome.storage.local.get(['taste_warm', 'taste_long'], (data) => {
        this.warm = data.taste_warm || {};
        this.long = data.taste_long || this._defaults();
        this._loaded = true;
        resolve();
      });
    });
  }

  _defaults() {
    return {
      visualDensity: 'comfortable',   // compact | comfortable | spacious
      layoutStyle: 'card',            // card | list | magazine | minimal
      favoredContent: [],             // content types user engages with
      hiddenContent: [],              // content types user hides
      colorScheme: 'dark',            // dark | warm | cool | forest | sunset | ocean
      fontSize: 100,
      contrast: 100,
      siteRules: {},                  // per-hostname overrides
      interactionPatterns: {},        // learned from signals
      contentRankWeights: {           // for re-ranking
        recency: 0.3,
        engagement: 0.2,
        authorTrust: 0.2,
        topicMatch: 0.3
      }
    };
  }

  async save() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        taste_warm: this.warm,
        taste_long: this.long
      }, resolve);
    });
  }

  // Record a preference signal
  async recordSignal(signal) {
    const { type, hostname, value, strength = 1 } = signal;

    // Hot memory — immediate session context
    if (!this.hot[hostname]) this.hot[hostname] = [];
    this.hot[hostname].push({ type, value, ts: Date.now() });

    // Warm memory — recent cross-session
    if (!this.warm[type]) this.warm[type] = {};
    this.warm[type][value] = (this.warm[type][value] || 0) + strength;

    // Promote to long-term if signal is strong enough
    if (this.warm[type][value] >= 5) {
      this._promoteToLong(type, value);
    }

    await this.save();
  }

  _promoteToLong(type, value) {
    if (type === 'layout_choice') {
      this.long.layoutStyle = value;
    } else if (type === 'density_choice') {
      this.long.visualDensity = value;
    } else if (type === 'color_scheme') {
      this.long.colorScheme = value;
    } else if (type === 'content_hide') {
      if (!this.long.hiddenContent.includes(value)) {
        this.long.hiddenContent.push(value);
      }
    } else if (type === 'content_favor') {
      if (!this.long.favoredContent.includes(value)) {
        this.long.favoredContent.push(value);
      }
    }
  }

  // Get effective preferences for a hostname (long + site overrides)
  getPreferences(hostname) {
    const base = { ...this.long };
    const siteOverride = this.long.siteRules[hostname];
    if (siteOverride) {
      Object.assign(base, siteOverride);
    }
    return base;
  }

  // Save a per-site rule ("always show reddit in compact dark mode")
  async setSiteRule(hostname, overrides) {
    if (!this.long.siteRules) this.long.siteRules = {};
    this.long.siteRules[hostname] = {
      ...this.long.siteRules[hostname],
      ...overrides
    };
    await this.save();
  }

  // Rank entities by taste graph weights
  rankEntities(entities) {
    const w = this.long.contentRankWeights;
    return entities
      .map(e => {
        e.rank =
          (e.data.recency || 0) * w.recency +
          (e.data.engagement || 0) * w.engagement +
          (e.data.authorTrust || 0) * w.authorTrust +
          (e.data.topicMatch || 0) * w.topicMatch;
        return e;
      })
      .sort((a, b) => b.rank - a.rank);
  }
}

if (typeof window !== 'undefined') {
  window.MemstalkerTaste = TasteGraph;
}
