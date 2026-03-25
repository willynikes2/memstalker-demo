/**
 * Generic Site Adapter — fallback for unsupported sites.
 *
 * Does best-effort DOM analysis to extract article/feed structure.
 * Theming still works via CSS custom properties even without deep parsing.
 */

(function() {
  const { PageType, PageModel, PageEntity } = window.MemstalkerPageModel;

  function parse() {
    // Try to detect page type from semantic HTML
    const article = document.querySelector('article, [role="article"], .post, .entry');
    const feed = document.querySelectorAll('article, [role="article"], .post, .entry, .card');

    if (feed.length > 3) return parseFeed(feed);
    if (article) return parseArticle(article);
    return new PageModel(PageType.UNKNOWN);
  }

  function parseFeed(items) {
    const model = new PageModel(PageType.FEED, [], { site: 'generic' });
    const container = items[0]?.parentElement;
    if (container) model.setRenderSlots({ container });

    items.forEach((el, i) => {
      const heading = el.querySelector('h1, h2, h3, h4, [class*="title"]');
      const link = el.querySelector('a');
      const img = el.querySelector('img');
      const time = el.querySelector('time, [datetime]');

      const entity = new PageEntity('post', {
        title: heading?.textContent?.trim() || link?.textContent?.trim() || '',
        url: link?.href || '',
        image: img?.src || '',
        timestamp: time?.getAttribute('datetime') || '',
        recency: 1 - (i / Math.max(items.length, 1))
      });
      entity.bindElement(el);
      model.addEntity(entity);
    });

    return model;
  }

  function parseArticle(el) {
    const model = new PageModel(PageType.ARTICLE, [], { site: 'generic' });
    const heading = el.querySelector('h1, h2') || document.querySelector('h1');
    const author = el.querySelector('[rel="author"], .author, .byline');
    const time = el.querySelector('time, [datetime]');

    const entity = new PageEntity('article', {
      title: heading?.textContent?.trim() || document.title,
      author: author?.textContent?.trim() || '',
      timestamp: time?.getAttribute('datetime') || '',
      wordCount: el.textContent?.split(/\s+/).length || 0
    });
    entity.bindElement(el);
    model.addEntity(entity);

    return model;
  }

  window.MemstalkerAdapter = { parse, site: 'generic' };
})();
