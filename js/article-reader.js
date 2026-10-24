// Article detail page (/artikel/baca/?id=…): renders the article and related
// cards, and runs the reading tracker. Progress follows the article body only
// and never goes down; reaching the end of the body (after the reader has
// scrolled) completes the article and awards ARTICLE_POINTS once per article.
import { articles, ARTICLE_POINTS } from "./article-data.js";
import { getState, update, logActivity, formatPoints, formatDate, escapeHtml } from "./store.js";
import { articleCard, articleImage, isRead } from "./article-list.js";

const END_TOLERANCE = 24; // px: the body counts as finished this close to its end
const RELATED_COUNT = 3;

const renderBody = (blocks) => blocks
  .map(([type, text]) => (type === "h" ? `<h2>${escapeHtml(text)}</h2>` : `<p>${escapeHtml(text)}</p>`))
  .join("");

const renderArticle = (article) => `
  <div class="reader__toolbar">
    <a class="btn btn--secondary btn--sm" href="/artikel/">Kembali ke Artikel</a>
  </div>
  <p class="meta">${escapeHtml(article.category)}</p>
  <h1 class="reader__title" id="article-title">${escapeHtml(article.title)}</h1>
  <p class="reader__byline">Redaksi PPS · <time datetime="${article.date}">${formatDate(article.date, { day: "numeric", month: "long", year: "numeric" })}</time> · ${article.readMinutes} menit baca</p>
  <figure class="reader__cover">
    ${articleImage(article.image, { sizes: "(min-width: 48em) 46rem, 100vw", alt: article.imageAlt, lazy: false })}
  </figure>
  <div class="reader__body" data-reader-body>${renderBody(article.body)}</div>`;

const renderNotFound = () => `
  <div class="reader__toolbar">
    <a class="btn btn--secondary btn--sm" href="/artikel/">Kembali ke Artikel</a>
  </div>
  <h1 class="reader__title">Artikel nggak ketemu</h1>
  <p class="reader__byline">Mungkin tautannya salah atau artikelnya sudah dipindah. Cek daftar artikel terbaru, ya.</p>`;

/** Related reading: other articles, unread ones first, newest first. */
const relatedTo = (article, state) => articles
  .filter((other) => other.id !== article.id)
  .sort((a, b) => Number(isRead(state, a.id)) - Number(isRead(state, b.id)))
  .slice(0, RELATED_COUNT);

const initTracker = (article, body, bar) => {
  const fill = bar.querySelector("[data-progress-fill]");
  const meter = bar.querySelector("[role=progressbar]");
  const status = bar.querySelector("[data-status]");
  const detail = bar.querySelector("[data-detail]");
  const points = `+${formatPoints(ARTICLE_POINTS)} Poin`;

  let highest = 0;
  let scrolled = false;
  let frame = 0;

  const paint = (progress) => {
    const percent = Math.round(progress * 100);
    fill.style.transform = `scaleX(${progress})`;
    meter.setAttribute("aria-valuenow", String(percent));
    detail.textContent = `${percent}% · ${points}`;
  };

  const showComplete = (fresh) => {
    paint(1);
    bar.classList.add("is-complete");
    bar.classList.toggle("is-new", fresh);
    status.textContent = fresh ? `Artikel selesai! ${points}` : "Artikel ini sudah lo selesaikan";
    detail.textContent = fresh ? "Poin masuk ke akun lo" : `${points} sudah diterima`;
  };

  const stop = () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", schedule);
  };

  const complete = () => {
    stop();
    let awarded = false;
    update((state) => {
      state.readArticles ??= [];
      if (state.readArticles.includes(article.id)) return;
      state.readArticles.push(article.id);
      state.points += ARTICLE_POINTS;
      logActivity(state, "article", `Selesai membaca ${article.title}`, ARTICLE_POINTS);
      awarded = true;
    });
    showComplete(awarded);
  };

  const measure = () => {
    frame = 0;
    const rect = body.getBoundingClientRect();
    const visibleBottom = window.innerHeight - bar.offsetHeight;
    const progress = Math.min(Math.max((visibleBottom - rect.top) / rect.height, 0), 1);
    highest = Math.max(highest, progress);
    // Opening an article never completes it: the reader has to scroll to the end.
    if (scrolled && rect.bottom <= visibleBottom + END_TOLERANCE) complete();
    else paint(highest);
  };

  function schedule() {
    if (!frame) frame = requestAnimationFrame(measure);
  }

  function onScroll() {
    scrolled = true;
    schedule();
  }

  bar.hidden = false;
  document.body.classList.add("has-reading-bar");

  if (isRead(getState(), article.id)) {
    showComplete(false);
    return;
  }

  status.innerHTML = 'Baca sampai habis<span class="reading-bar__more">&nbsp;buat dapetin poin</span>';
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", schedule);
  measure();
};

export const init = (root) => {
  const id = new URLSearchParams(location.search).get("id");
  const article = articles.find((entry) => entry.id === id);
  const reader = root.querySelector("[data-reader]");

  if (!article) {
    document.title = "Artikel nggak ketemu — Pria Punya Selera";
    reader.innerHTML = renderNotFound();
    return;
  }

  document.title = `${article.title} — Pria Punya Selera`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", article.excerpt);
  reader.innerHTML = renderArticle(article);

  const state = getState();
  const related = root.querySelector("[data-related]");
  related.querySelector("[data-related-list]").innerHTML = relatedTo(article, state).map((other) => articleCard(other, state)).join("");
  related.hidden = false;

  initTracker(article, reader.querySelector("[data-reader-body]"), root.querySelector("[data-reading-bar]"));
};
