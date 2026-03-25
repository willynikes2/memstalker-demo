/**
 * Transformer — renders normalized page models into themed views.
 *
 * Takes a PageModel + TasteGraph preferences and applies:
 * - Color scheme (CSS custom properties, not CSS filters)
 * - Layout transformation (card/list/magazine/minimal)
 * - Content reordering by taste rank
 * - Noise hiding (sponsored, low-engagement)
 * - Visual density adjustment
 */

// Whitelists for DOM attribute safety (Codex security review)
const VALID_SCHEMES = new Set(['dark', 'warm', 'cool', 'forest', 'sunset', 'ocean']);
const VALID_LAYOUTS = new Set(['card', 'list', 'magazine', 'minimal']);
const VALID_DENSITIES = new Set(['compact', 'comfortable', 'spacious']);

class Transformer {
  constructor(taste, trust) {
    this.taste = taste;
    this.trust = trust;
  }

  async apply(pageModel) {
    const hostname = location.hostname;
    const prefs = this.taste.getPreferences(hostname);

    // Sanitize values before any DOM writes
    const safeScheme = VALID_SCHEMES.has(prefs.colorScheme) ? prefs.colorScheme : 'dark';
    const safeLayout = VALID_LAYOUTS.has(prefs.layoutStyle) ? prefs.layoutStyle : 'card';
    const safeDensity = VALID_DENSITIES.has(prefs.visualDensity) ? prefs.visualDensity : 'comfortable';
    const safeFontSize = Math.max(80, Math.min(150, parseInt(prefs.fontSize) || 100));
    const safeContrast = Math.max(80, Math.min(150, parseInt(prefs.contrast) || 100));

    // Always allowed: theming
    this._applyColorScheme(safeScheme);
    this._applyDensity(safeDensity);
    this._applyFontSize(safeFontSize);
    this._applyContrast(safeContrast);

    // Needs suggest+ trust: reordering
    if (this.trust.canDo('reorder', hostname) && pageModel.entities.length > 0) {
      this._reorderEntities(pageModel);
    }

    // Needs assist+ trust: hiding noise
    if (this.trust.canDo('hide', hostname)) {
      this._hideNoise(pageModel, prefs);
    }

    // Apply layout style
    this._applyLayout(safeLayout, pageModel);

    // Mark page as themed
    document.documentElement.setAttribute('data-memstalker', 'active');
    document.documentElement.setAttribute('data-ms-scheme', safeScheme);
    document.documentElement.setAttribute('data-ms-density', safeDensity);
    document.documentElement.setAttribute('data-ms-layout', safeLayout);
  }

  _applyColorScheme(scheme) {
    const schemes = {
      dark:   { bg: '#0f0f23', fg: '#e0e0e0', accent: '#e94560', surface: '#1a1a2e', muted: '#666' },
      warm:   { bg: '#1a1510', fg: '#e8dcc8', accent: '#d4843e', surface: '#2a2018', muted: '#8a7a6a' },
      cool:   { bg: '#0a1628', fg: '#c8d8e8', accent: '#4a9eff', surface: '#122040', muted: '#607090' },
      forest: { bg: '#0a1a0a', fg: '#c8e0c8', accent: '#4caf50', surface: '#142814', muted: '#5a7a5a' },
      sunset: { bg: '#1a0a0a', fg: '#e8d0c8', accent: '#ff6b35', surface: '#2a1410', muted: '#8a6050' },
      ocean:  { bg: '#0a141a', fg: '#c8dce8', accent: '#00bcd4', surface: '#102838', muted: '#507080' }
    };
    const vars = schemes[scheme] || schemes.dark;
    const root = document.documentElement.style;
    root.setProperty('--ms-bg', vars.bg);
    root.setProperty('--ms-fg', vars.fg);
    root.setProperty('--ms-accent', vars.accent);
    root.setProperty('--ms-surface', vars.surface);
    root.setProperty('--ms-muted', vars.muted);
  }

  _applyDensity(density) {
    const spacing = { compact: '4px', comfortable: '8px', spacious: '16px' };
    const lineHeight = { compact: '1.3', comfortable: '1.5', spacious: '1.8' };
    const root = document.documentElement.style;
    root.setProperty('--ms-spacing', spacing[density] || spacing.comfortable);
    root.setProperty('--ms-line-height', lineHeight[density] || lineHeight.comfortable);
  }

  _applyFontSize(pct) {
    if (pct && pct !== 100) {
      document.documentElement.style.setProperty('--ms-font-scale', (pct / 100).toFixed(2));
    }
  }

  _applyContrast(pct) {
    if (pct && pct !== 100) {
      document.documentElement.style.setProperty('--ms-contrast', (pct / 100).toFixed(2));
    }
  }

  _reorderEntities(pageModel) {
    const ranked = this.taste.rankEntities(pageModel.entities);
    ranked.forEach((entity, i) => {
      if (entity.element && entity.element.parentNode) {
        entity.element.style.order = i;
      }
    });
  }

  _hideNoise(pageModel, prefs) {
    pageModel.entities.forEach(entity => {
      const shouldHide =
        prefs.hiddenContent.includes(entity.type) ||
        entity.data.sponsored === true ||
        entity.data.noise === true;
      if (shouldHide && entity.element) {
        entity.element.style.display = 'none';
        entity.visible = false;
      }
    });
  }

  _applyLayout(style, pageModel) {
    // Layout transforms are applied via CSS classes on the container
    const container = pageModel.renderSlots.container;
    if (container) {
      container.classList.add(`ms-layout-${style}`);
    }
  }
}

if (typeof window !== 'undefined') {
  window.MemstalkerTransformer = Transformer;
}
