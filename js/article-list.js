// Article listing (/artikel/): renders one card per article from article-data.js.
// The card markup is shared with the "Baca Artikel Lainnya" list on detail pages.
import { articles, ARTICLE_POINTS, articleUrl } from "./article-data.js";
import { getState, onChange, formatPoints, formatDate, escapeHtml } from "./store.js";

export const isRead = (state, id) => (state.readArticles ?? []).includes(id);

export const articleImage = (image, { sizes, alt = "", lazy = true } = {}) => `
  <img src="${image.src}"${image.srcset ? ` srcset="${image.srcset}" sizes="${sizes}"` : ""}
       alt="${escapeHtml(alt)}" width="${image.width}" height="${image.height}"${lazy ? ' loading="lazy"' : ""}
       style="object-position: ${image.position}">`;

export const articleCard = (article, state) => {
  const read = isRead(state, article.id);
  return `
    <li>
      <article class="article-card">
        <div class="article-card__media">
          ${articleImage(article.image, { sizes: "(min-width: 64em) 26rem, (min-width: 40em) 50vw, 100vw" })}
        </div>
        <div class="article-card__body">
          <p class="meta">${escapeHtml(article.category)} · ${article.readMinutes} menit baca</p>
          <h3 class="article-card__title"><a class="article-card__link" href="${articleUrl(article.id)}" data-auth-required>${escapeHtml(article.title)}</a></h3>
          <p class="article-card__excerpt">${escapeHtml(article.excerpt)}</p>
          <div class="article-card__footer">
            <time class="article-card__date" datetime="${article.date}">${formatDate(article.date)}</time>
            <span class="points-tag${read ? " is-done" : ""}">${read ? "Selesai · " : ""}+${formatPoints(ARTICLE_POINTS)} Poin</span>
          </div>
        </div>
      </article>
    </li>`;
};

export const init = (root) => {
  // Old in-page links (/artikel/#<id>) now go to the article's own page.
  const redirectLegacy = () => {
    const legacy = articles.find((article) => article.id === location.hash.slice(1));
    if (legacy) location.replace(articleUrl(legacy.id));
    return Boolean(legacy);
  };
  window.addEventListener("hashchange", redirectLegacy);
  if (redirectLegacy()) return;

  const list = root.querySelector("[data-article-list]");
  const render = (state) => {
    list.innerHTML = articles.map((article) => articleCard(article, state)).join("");
  };
  onChange(render);
  render(getState());
};
