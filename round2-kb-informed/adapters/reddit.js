/**
 * Reddit Site Adapter — parses Reddit DOM into normalized page model.
 *
 * From KB: "Any content feed becomes: author, title, media, timestamp,
 * engagement metrics, body preview, action buttons"
 */

(function() {
  const { PageType, PageModel, PageEntity } = window.MemstalkerPageModel;

  function parse() {
    const path = location.pathname;

    // Detect page type
    if (path.match(/^\/r\/\w+\/comments\//)) {
      return parseThread();
    }
    return parseFeed();
  }

  function parseFeed() {
    const model = new PageModel(PageType.FEED, [], { site: 'reddit' });

    // New Reddit (shreddit- elements)
    const posts = document.querySelectorAll('shreddit-post, [data-testid="post-container"], .Post');
    const container = posts[0]?.parentElement;
    if (container) {
      model.setRenderSlots({ container });
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
    }

    posts.forEach((el, i) => {
      const entity = new PageEntity('post', {
        title: el.getAttribute('post-title') || el.querySelector('h3')?.textContent?.trim() || '',
        author: el.getAttribute('author') || el.querySelector('[data-testid="post_author_link"]')?.textContent?.trim() || '',
        subreddit: el.getAttribute('subreddit-prefixed-name') || '',
        score: parseInt(el.getAttribute('score') || '0'),
        commentCount: parseInt(el.getAttribute('comment-count') || '0'),
        permalink: el.getAttribute('permalink') || '',
        sponsored: el.getAttribute('is-promoted') === 'true' || el.classList.contains('promotedlink'),
        engagement: normalizeEngagement(parseInt(el.getAttribute('score') || '0')),
        recency: 1 - (i / Math.max(posts.length, 1)),  // position-based proxy
        noise: el.getAttribute('is-promoted') === 'true'
      });
      entity.bindElement(el);
      model.addEntity(entity);
    });

    return model;
  }

  function parseThread() {
    const model = new PageModel(PageType.FORUM_THREAD, [], { site: 'reddit' });

    const comments = document.querySelectorAll('shreddit-comment, .Comment, [data-testid="comment"]');
    comments.forEach((el) => {
      const entity = new PageEntity('comment', {
        author: el.getAttribute('author') || el.querySelector('.author')?.textContent?.trim() || '',
        score: parseInt(el.getAttribute('score') || '0'),
        depth: parseInt(el.getAttribute('depth') || '0'),
        engagement: normalizeEngagement(parseInt(el.getAttribute('score') || '0')),
        authorTrust: 0.5  // default, could be enhanced with karma lookup
      });
      entity.bindElement(el);
      model.addEntity(entity);
    });

    return model;
  }

  function normalizeEngagement(score) {
    // Log-scale normalization: 0=0, 10=0.3, 100=0.6, 1000=0.9, 10000=1.0
    if (score <= 0) return 0;
    return Math.min(Math.log10(score) / 4, 1);
  }

  window.MemstalkerAdapter = { parse, site: 'reddit' };
})();
