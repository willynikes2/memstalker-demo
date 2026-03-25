/**
 * Hacker News Site Adapter — multi-page-type normalization.
 *
 * HN has: front page (feed), item page (thread), user page.
 */

(function() {
  const { PageType, PageModel, PageEntity } = window.MemstalkerPageModel;

  function parse() {
    const path = location.pathname;
    if (path.startsWith('/item')) return parseThread();
    return parseFeed();
  }

  function parseFeed() {
    const model = new PageModel(PageType.FEED, [], { site: 'hackernews' });

    const rows = document.querySelectorAll('.athing');
    const container = document.querySelector('.itemlist, #hnmain table');
    if (container) model.setRenderSlots({ container });

    rows.forEach((row, i) => {
      const titleEl = row.querySelector('.titleline > a');
      const subtext = row.nextElementSibling;
      const scoreEl = subtext?.querySelector('.score');
      const authorEl = subtext?.querySelector('.hnuser');
      const commentLink = subtext?.querySelectorAll('a');
      const commentEl = commentLink?.[commentLink.length - 1];

      const score = parseInt(scoreEl?.textContent || '0');
      const commentCount = parseInt(commentEl?.textContent || '0');

      const entity = new PageEntity('post', {
        title: titleEl?.textContent?.trim() || '',
        url: titleEl?.href || '',
        author: authorEl?.textContent?.trim() || '',
        score,
        commentCount,
        engagement: normalizeEngagement(score),
        recency: 1 - (i / Math.max(rows.length, 1)),
        topicMatch: 0.5,  // default; could be enhanced by taste keywords
        authorTrust: 0.5
      });
      entity.bindElement(row);
      model.addEntity(entity);
    });

    return model;
  }

  function parseThread() {
    const model = new PageModel(PageType.FORUM_THREAD, [], { site: 'hackernews' });

    const comments = document.querySelectorAll('.comtr');
    comments.forEach((row) => {
      const indent = row.querySelector('.ind img');
      const depth = indent ? parseInt(indent.getAttribute('width') || '0') / 40 : 0;
      const authorEl = row.querySelector('.hnuser');
      const textEl = row.querySelector('.commtext');

      const entity = new PageEntity('comment', {
        author: authorEl?.textContent?.trim() || '',
        body: textEl?.textContent?.trim()?.slice(0, 200) || '',
        depth,
        authorTrust: 0.5,
        engagement: 0.5
      });
      entity.bindElement(row);
      model.addEntity(entity);
    });

    return model;
  }

  function normalizeEngagement(score) {
    if (score <= 0) return 0;
    return Math.min(Math.log10(score) / 3, 1);  // HN scores are lower than Reddit
  }

  window.MemstalkerAdapter = { parse, site: 'hackernews' };
})();
