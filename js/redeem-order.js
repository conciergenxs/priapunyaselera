// Merch redemption: success page (/loyalty/tukar/berhasil/?order=…) and
// "Pesanan Merchandise" (/loyalty/pesanan/): order list with status tabs, or
// one order's tracking when ?order=<ref>.
// Prototype: orders come from the browser's demo member state (store.js) and
// never advance on their own because no fulfilment system exists yet, so
// timestamps and tracking numbers are shown only when an order has them.
import { getState, onChange, formatPoints, formatDate, escapeHtml } from "./store.js";
import {
  findMerch, merchImage, findOrder, trackingUrl, addressSummary,
  ORDER_STEPS, ORDER_TABS, ORDERS_URL, orderTab,
} from "./redeem-data.js";

const MOCK_NOTE = '<p class="paper__note">Prototipe: pesanan ini disimpan di browser lo dan belum diproses sistem PPS.</p>';

const checkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17l9-10"/></svg>';
const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/></svg>';
const backIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"/></svg>';

const dateTime = (iso) => formatDate(iso, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const shortDate = (iso) => formatDate(iso, { day: "numeric", month: "short", year: "numeric" });

const badge = (order) => {
  const tab = orderTab(order);
  return `<span class="order-badge order-badge--${tab.key}">${tab.label}</span>`;
};

const itemRow = (order) => {
  const item = findMerch(order.itemId);
  return `
    <div class="order-item">
      ${item ? `<img src="${merchImage(item, 400)}" alt="${escapeHtml(item.alt)}" width="400" height="400">` : ""}
      <div>
        <p class="order-item__name">${escapeHtml(order.name)}</p>
        <p class="order-item__points">${formatPoints(order.points)} Poin</p>
      </div>
    </div>`;
};

const refBlock = (order) => `
  <div class="order-ref">
    <div>
      <p class="order-ref__label">Nomor pesanan</p>
      <p class="order-ref__value">${escapeHtml(order.id)}</p>
    </div>
    <button class="order-ref__copy" type="button" data-copy="${escapeHtml(order.id)}">${copyIcon}<span aria-live="polite">Salin</span></button>
  </div>`;

const notFound = () => `
  <div class="paper paper--narrow paper--center">
    <h1 class="paper__title" id="page-title">Pesanan nggak ketemu</h1>
    <p class="paper__text">Nomor pesanan ini nggak ada di akun lo. Cek lagi tautannya, atau lihat semua pesanan lo.</p>
    <div class="paper__actions">
      <a class="btn btn--primary" href="${ORDERS_URL}">Pesanan Merchandise</a>
      <a class="btn btn--outline" href="/loyalty/">Kembali ke Loyalty</a>
    </div>
  </div>`;

/* Success ----------------------------------------------------------------- */

const renderSuccess = (order) => `
  <div class="paper paper--narrow paper--center">
    <span class="success-badge" aria-hidden="true">${checkIcon}</span>
    <h1 class="paper__title" id="page-title">Penukaran Berhasil!</h1>
    <p class="paper__text">Penukaran merchandise lo sudah dicatat. Simpan nomor pesanan ini untuk melacak pengirimannya.</p>
    ${refBlock(order)}
    ${itemRow(order)}
    <dl class="modal__summary">
      <div><dt>Poin ditukar</dt><dd>${formatPoints(order.points)} Poin</dd></div>
      <div><dt>Penerima</dt><dd>${escapeHtml(order.recipient.name)}</dd></div>
      <div><dt>Status</dt><dd>${badge(order)}</dd></div>
    </dl>
    <div class="paper__actions">
      <a class="btn btn--primary" href="${trackingUrl(order.id)}">Lacak Pesanan</a>
      <a class="btn btn--outline" href="/loyalty/">Kembali ke Loyalty</a>
    </div>
    ${MOCK_NOTE}
  </div>`;

/* Order list -------------------------------------------------------------- */

const TABS = [{ key: "semua", label: "Semua" }, ...ORDER_TABS];

const orderCard = (order) => {
  const tab = orderTab(order);
  const action = tab.key === "dikirim" ? "Lacak Pengiriman" : "Lihat Detail";
  return `
    <li class="paper order-card">
      <div class="order-card__head">
        <span class="order-card__ref">${escapeHtml(order.id)}</span>
        ${badge(order)}
      </div>
      ${itemRow(order)}
      <div class="order-card__foot">
        <span class="order-card__date">Dipesan <time datetime="${order.createdAt}">${shortDate(order.createdAt)}</time></span>
        <a class="btn btn--primary btn--sm" href="${trackingUrl(order.id)}" aria-label="${action} ${escapeHtml(order.id)}">${action}</a>
      </div>
    </li>`;
};

const emptyState = (tab) => `
  <div class="paper paper--center orders__empty">
    <p class="paper__title">${tab.key === "semua" ? "Belum ada pesanan" : `Belum ada pesanan ${tab.label.toLowerCase()}`}</p>
    <p class="paper__text">${tab.key === "semua"
    ? "Tukar poin lo dengan merchandise pilihan, pesanannya bakal muncul di sini."
    : "Pesanan dengan status ini bakal muncul di sini."}</p>
    ${tab.key === "semua" ? '<div class="paper__actions"><a class="btn btn--primary" href="/loyalty/">Pilih Merchandise</a></div>' : ""}
  </div>`;

const renderList = (root, orders, active) => {
  const counts = Object.fromEntries(TABS.map((tab) => [tab.key, tab.key === "semua" ? orders.length : orders.filter((order) => orderTab(order).key === tab.key).length]));
  root.innerHTML = `
    <div class="orders__head">
      <h1 class="page-title" id="page-title">Pesanan Merchandise</h1>
      <p class="page-title__text">Pantau status merchandise yang lo tukar dengan poin.</p>
    </div>
    <div class="order-tabs" role="tablist" aria-label="Status pesanan">
      ${TABS.map((tab) => `
        <button class="order-tabs__tab" type="button" role="tab" id="tab-${tab.key}" aria-controls="orders-panel"
                aria-selected="${tab.key === active}" tabindex="${tab.key === active ? 0 : -1}" data-tab="${tab.key}">
          ${tab.label}${counts[tab.key] ? ` <span class="order-tabs__count">${counts[tab.key]}</span>` : ""}
        </button>`).join("")}
    </div>
    <div id="orders-panel" role="tabpanel" aria-labelledby="tab-${active}" data-orders-panel></div>`;
  paintPanel(root, orders, active);
};

const paintPanel = (root, orders, active) => {
  const tab = TABS.find((entry) => entry.key === active);
  const shown = active === "semua" ? orders : orders.filter((order) => orderTab(order).key === active);
  root.querySelector("[data-orders-panel]").innerHTML = shown.length
    ? `<ul class="order-list">${shown.map(orderCard).join("")}</ul>`
    : emptyState(tab);
};

const initList = (root) => {
  const tabKeys = TABS.map((tab) => tab.key);
  const fromUrl = new URLSearchParams(location.search).get("status");
  let active = tabKeys.includes(fromUrl) ? fromUrl : "semua";
  const orders = () => getState().orders ?? [];

  const select = (key, focus = false) => {
    active = key;
    root.querySelectorAll("[data-tab]").forEach((button) => {
      const on = button.dataset.tab === key;
      button.setAttribute("aria-selected", String(on));
      button.tabIndex = on ? 0 : -1;
      if (on) {
        button.scrollIntoView({ block: "nearest", inline: "nearest" });
        if (focus) button.focus();
      }
    });
    root.querySelector("[data-orders-panel]").setAttribute("aria-labelledby", `tab-${key}`);
    paintPanel(root, orders(), key);
    // Remember the tab, so Back from an order returns to it.
    const url = new URL(location.href);
    if (key === "semua") url.searchParams.delete("status");
    else url.searchParams.set("status", key);
    history.replaceState(history.state, "", url.pathname + url.search);
  };

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) select(button.dataset.tab);
  });

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  root.addEventListener("keydown", (event) => {
    if (!event.target.closest("[data-tab]")) return;
    const index = tabKeys.indexOf(active);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabKeys.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabKeys[(next + tabKeys.length) % tabKeys.length], true);
  });

  renderList(root, orders(), active);
  onChange((state) => renderList(root, state.orders ?? [], active));
};

/* Order detail ------------------------------------------------------------ */

/** When each step happened, if the order records it. Only "received" is known today. */
const stepTime = (order, label, index) => order.history?.[label] ?? (index === 0 ? order.createdAt : null);

const renderDetail = (order) => {
  const current = Math.max(ORDER_STEPS.indexOf(order.status), 0);
  const steps = ORDER_STEPS.map((label, index) => {
    const state = index < current ? "done" : index === current ? "current" : "upcoming";
    const time = index <= current ? stepTime(order, label, index) : null;
    return `
      <li class="timeline__step is-${state}"${state === "current" ? ' aria-current="step"' : ""}>
        <span class="timeline__label">${label}</span>
        ${time ? `<time class="timeline__time" datetime="${time}">${dateTime(time)}</time>` : ""}
      </li>`;
  }).join("");
  const shipped = ORDER_STEPS.indexOf(order.status) >= ORDER_STEPS.indexOf("Pesanan Dikirim");
  return `
    <a class="orders__back" href="${ORDERS_URL}">${backIcon}<span>Pesanan Merchandise</span></a>
    <h1 class="page-title" id="page-title">Detail Pesanan</h1>

    <div class="order-detail">
      <div class="paper">
        <div class="order-card__head">
          <span class="order-card__date">Dipesan <time datetime="${order.createdAt}">${dateTime(order.createdAt)}</time></span>
          ${badge(order)}
        </div>
        ${refBlock(order)}
        ${itemRow(order)}
      </div>

      <div class="paper">
        <h2 class="paper__heading" id="timeline-title">Status Pengiriman</h2>
        <ol class="timeline" aria-labelledby="timeline-title">${steps}</ol>
      </div>

      <div class="paper">
        <h2 class="paper__heading">Info Pengiriman</h2>
        <dl class="modal__summary">
          <div><dt>Penerima</dt><dd>${escapeHtml(order.recipient.name)}<br>${escapeHtml(order.recipient.phone)}</dd></div>
          <div><dt>Alamat</dt><dd>${escapeHtml(addressSummary(order.address))}</dd></div>
          <div><dt>Catatan kurir</dt><dd>${order.address.note ? escapeHtml(order.address.note) : "—"}</dd></div>
          <div><dt>Nomor resi</dt><dd>${order.trackingNumber ? escapeHtml(order.trackingNumber) : shipped ? "Belum tersedia" : "Tersedia setelah pesanan dikirim"}</dd></div>
        </dl>
        ${MOCK_NOTE}
      </div>
    </div>`;
};

/* Copy order number ------------------------------------------------------- */

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const label = button.querySelector("span");
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    label.textContent = "Tersalin";
  } catch {
    label.textContent = "Gagal menyalin";
  }
  setTimeout(() => { label.textContent = "Salin"; }, 2000);
});

/* Wiring ------------------------------------------------------------------ */

const root = document.querySelector("[data-order-view]");
const view = root.dataset.orderView;
const ref = new URLSearchParams(location.search).get("order");
const order = ref ? findOrder(getState(), ref) : null;

if (view === "orders" && !ref) {
  initList(root);
} else if (order) {
  root.innerHTML = view === "success" ? renderSuccess(order) : renderDetail(order);
  if (view !== "success") document.title = `Pesanan ${order.id} — Pria Punya Selera`;
} else {
  root.innerHTML = notFound();
}
