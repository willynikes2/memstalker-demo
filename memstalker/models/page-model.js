/**
 * Normalized Page Model — the core abstraction from KB doc #602.
 *
 * Instead of ad-hoc transforms, every page becomes a structured model.
 * Site adapters produce these; the transformer renders them.
 */

const PageType = Object.freeze({
  FEED: 'feed',
  PRODUCT_LIST: 'product_list',
  PRODUCT_DETAIL: 'product_detail',
  ARTICLE: 'article',
  VIDEO: 'video',
  FORUM_THREAD: 'forum_thread',
  SEARCH_RESULTS: 'search_results',
  UNKNOWN: 'unknown'
});

class PageModel {
  constructor(type, entities = [], meta = {}) {
    this.type = type;
    this.entities = entities;
    this.meta = {
      url: location.href,
      hostname: location.hostname,
      title: document.title,
      timestamp: Date.now(),
      ...meta
    };
    this.actions = [];       // possible user actions
    this.agentActions = [];  // possible agent actions
    this.renderSlots = {};   // named slots for re-rendering
  }

  addEntity(entity) {
    this.entities.push(entity);
    return this;
  }

  setRenderSlots(slots) {
    this.renderSlots = slots;
    return this;
  }
}

class PageEntity {
  constructor(type, data = {}) {
    this.type = type;     // 'post', 'comment', 'product', 'article', 'media'
    this.data = data;     // normalized fields
    this.element = null;  // reference to source DOM element
    this.visible = true;
    this.rank = 0;        // for re-ranking by taste graph
  }

  bindElement(el) {
    this.element = el;
    return this;
  }
}

// Export for content script context
if (typeof window !== 'undefined') {
  window.MemstalkerPageModel = { PageType, PageModel, PageEntity };
}
