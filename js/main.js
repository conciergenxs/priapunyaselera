// Mobile/tablet navigation toggle. Desktop shows the nav inline (see main.css).
(() => {
  const header = document.querySelector(".site-header");
  const toggle = header?.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!header || !toggle || !nav) return;

  const desktop = window.matchMedia("(min-width: 64em)");

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    header.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => setOpen(!isOpen()));

  // Close after choosing a link, on Escape, on an outside click, or when the
  // viewport grows to the desktop layout.
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (isOpen() && !header.contains(event.target)) setOpen(false);
  });

  desktop.addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
})();

// Scroll-driven header bar: widens from a pill around the nav (--p = 0) to the
// full-width bar (--p = 1). CSS does the geometry; this only feeds --p and the
// nav width. Pages without a dark hero mark the header data-header-solid and
// keep the full bar at all times. Scrolling sets a target; one rAF loop eases toward it (no overshoot)
// and stops once settled.
(() => {
  const header = document.querySelector(".site-header");
  const navList = header?.querySelector(".site-nav__list");
  if (!header || !navList) return;

  const RANGE = 200; // px of scroll over which the bar expands
  const FOLLOW = 0.18; // fraction of the remaining distance covered per frame
  const EXPANDED = 0.95; // --p at which the bar counts as expanded (gold MASUK)
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let current = null;
  let target = 0;
  let frame = 0;

  const smoothstep = (t) => t * t * (3 - 2 * t);

  const render = () => {
    frame = 0;
    const remaining = target - current;
    current = reducedMotion.matches || Math.abs(remaining) < 0.001 ? target : current + remaining * FOLLOW;
    header.style.setProperty("--p", current.toFixed(4));
    header.classList.toggle("is-expanded", current >= EXPANDED);
    if (current !== target) frame = requestAnimationFrame(render);
  };

  const solid = header.hasAttribute("data-header-solid");

  const onScroll = () => {
    target = solid ? 1 : smoothstep(Math.min(Math.max(window.scrollY / RANGE, 0), 1));
    if (current === null) current = target; // first paint: start where the page already is
    if (!frame) frame = requestAnimationFrame(render);
  };

  // Tracks the nav width through font loading and breakpoint changes.
  const resizeObserver = new ResizeObserver(([entry]) => {
    header.style.setProperty("--nav-w", `${entry.borderBoxSize[0].inlineSize}px`);
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  resizeObserver.observe(navList);
  onScroll();
})();
