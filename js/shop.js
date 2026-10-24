// Guild shop: item picker + detail, cart, activity and transactions for one
// catalog ("merch" or "pass"). Both shop pages share this module and markup.
import { catalog } from "./catalog.js";
import { getState, update, onChange, logActivity, formatPoints, formatDate, escapeHtml } from "./store.js";

const LOGO = "/assets/home/logo.png";

/** Ticket visual for an exclusive pass; also used as its "product image". */
export const passTicket = (item, { size = "" } = {}) => `
  <div class="pass-ticket ${size ? `pass-ticket--${size}` : ""}">
    <div class="pass-ticket__main">
      <p class="pass-ticket__event">${escapeHtml(item.event)}</p>
      <p class="pass-ticket__name">${escapeHtml(item.name)}</p>
      <p class="pass-ticket__info">${formatDate(item.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${escapeHtml(item.venue)}</p>
    </div>
    <div class="pass-ticket__stub">
      <img src="${LOGO}" alt="" width="404" height="304">
      <p class="pass-ticket__points">${formatPoints(item.points)} Poin</p>
    </div>
  </div>`;

const merchImage = (item, sizes) => `
  <img src="${item.image}-800.webp" srcset="${item.image}-400.webp 400w, ${item.image}-800.webp 800w"
       sizes="${sizes}" alt="${escapeHtml(item.alt)}" width="800" height="800">`;

const qtyControl = (value, max, key, label) => `
  <div class="qty" role="group" aria-label="${escapeHtml(label)}">
    <button class="qty__btn" type="button" data-step="-1" data-focus-key="${key}-dec" aria-label="Kurangi" ${value <= 1 ? "disabled" : ""}>−</button>
    <output class="qty__value" aria-live="polite">${value}</output>
    <button class="qty__btn" type="button" data-step="1" data-focus-key="${key}-inc" aria-label="Tambah" ${value >= max ? "disabled" : ""}>+</button>
  </div>`;

/** Re-render while keeping keyboard focus on the same control. */
const renderInto = (element, html) => {
  const key = element.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
  element.innerHTML = html;
  if (key) element.querySelector(`[data-focus-key="${CSS.escape(key)}"]`)?.focus();
};

export const init = (root) => {
  const shop = root.dataset.shop;
  const items = catalog[shop];
  const find = (id) => items.find((item) => item.id === id);
  const isPass = shop === "pass";

  const picker = root.querySelector("[data-shop-picker]");
  const detail = root.querySelector("[data-shop-detail]");
  const cart = root.querySelector("[data-shop-cart]");
  const activity = root.querySelector("[data-shop-activity]");
  const transactions = root.querySelector("[data-shop-transactions]");

  const fromHash = find(location.hash.slice(1));
  let selected = fromHash ?? items[0];
  let qty = 1;
  let detailMessage = "";
  let cartMessage = "";

  const renderPicker = () => {
    renderInto(picker, items.map((item) => `
      <li>
        <button class="shop-picker__item" type="button" data-item="${item.id}" data-focus-key="pick-${item.id}" aria-pressed="${item === selected}">
          ${isPass
            ? `<span class="shop-picker__pass" aria-hidden="true">${escapeHtml(item.event)}</span>`
            : `<img src="${item.image}-400.webp" alt="" width="400" height="400" loading="lazy">`}
          <span class="shop-picker__name">${escapeHtml(item.name)}</span>
          <span class="shop-picker__points">${formatPoints(item.points)} Poin</span>
        </button>
      </li>`).join(""));
  };

  const renderDetail = () => {
    const item = selected;
    renderInto(detail, `
      <div class="shop-detail__media">
        ${isPass ? passTicket(item, { size: "lg" }) : merchImage(item, "(min-width: 64em) 22rem, (min-width: 48em) 40vw, 90vw")}
      </div>
      <div class="shop-detail__info">
        ${isPass ? `<p class="shop-detail__eyebrow">${escapeHtml(item.event)}</p>` : ""}
        <h3 class="shop-detail__name">${escapeHtml(item.name)}</h3>
        <p class="shop-detail__points">${formatPoints(item.points)} Poin</p>
        <p class="shop-detail__desc">${escapeHtml(item.description)}</p>
        <dl class="specs">
          ${item.details.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
        <div class="shop-detail__buy">
          ${qtyControl(qty, item.maxQty, "detail", `Jumlah ${item.name}`)}
          <button class="btn btn--primary" type="button" data-add data-focus-key="add">Tambah ke Keranjang</button>
        </div>
        <p class="shop-detail__note">Maks. ${item.maxQty} per penukaran.</p>
        <p class="status" role="status">${escapeHtml(detailMessage)}</p>
      </div>`);
  };

  const renderCart = (state) => {
    const lines = state.carts[shop];
    const total = lines.reduce((sum, line) => sum + line.qty * find(line.id).points, 0);
    const remaining = state.points - total;
    const short = remaining < 0;
    renderInto(cart, `
      <h3 class="panel__title" id="cart-title" tabindex="-1">Keranjang</h3>
      ${lines.length ? `
        <ul class="cart-list">
          ${lines.map((line) => {
            const item = find(line.id);
            return `
              <li class="cart-row" data-line="${item.id}">
                <div class="cart-row__info">
                  <p class="cart-row__name">${escapeHtml(item.name)}</p>
                  <p class="cart-row__each">${formatPoints(item.points)} Poin / item</p>
                </div>
                ${qtyControl(line.qty, item.maxQty, `cart-${item.id}`, `Jumlah ${item.name} di keranjang`)}
                <p class="cart-row__total">${formatPoints(item.points * line.qty)}</p>
                <button class="link-button" type="button" data-remove data-focus-key="remove-${item.id}">Hapus</button>
              </li>`;
          }).join("")}
        </ul>`
        : `<p class="panel__empty">Keranjang lo masih kosong. Pilih item lalu tekan “Tambah ke Keranjang”.</p>`}
      <dl class="cart-summary">
        <div><dt>Total</dt><dd>${formatPoints(total)} Poin</dd></div>
        <div><dt>Saldo poin</dt><dd>${formatPoints(state.points)} Poin</dd></div>
        <div class="${short ? "is-short" : ""}"><dt>Sisa setelah tukar</dt><dd>${short ? "Poin kurang" : `${formatPoints(remaining)} Poin`}</dd></div>
      </dl>
      <button class="btn btn--primary cart-checkout" type="button" data-checkout data-focus-key="checkout" ${!lines.length || short ? "disabled" : ""}>Tukar Poin</button>
      <p class="status" role="status">${short ? `Poin lo kurang ${formatPoints(-remaining)} untuk keranjang ini.` : escapeHtml(cartMessage)}</p>`);
  };

  const renderActivity = (state) => {
    const rows = state.activity.filter((entry) => entry.shop === shop).slice(0, 8);
    activity.innerHTML = rows.length
      ? rows.map((entry) => `
          <li class="activity-row">
            <div>
              <p class="activity-row__text">${escapeHtml(entry.text)}</p>
              <time class="activity-row__date" datetime="${entry.date}">${formatDate(entry.date, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
            </div>
            <p class="activity-row__points ${entry.points > 0 ? "is-gain" : ""}">${entry.points ? `${entry.points > 0 ? "+" : "−"}${formatPoints(Math.abs(entry.points))}` : "—"}</p>
          </li>`).join("")
      : `<li class="panel__empty">Belum ada aktivitas.</li>`;
  };

  const renderTransactions = (state) => {
    const rows = state.transactions.filter((txn) => txn.shop === shop);
    transactions.innerHTML = rows.length
      ? rows.map((txn) => `
          <li class="txn">
            <div class="txn__head">
              <p class="txn__id">${escapeHtml(txn.id)}</p>
              <span class="txn__status">${escapeHtml(txn.status)}</span>
            </div>
            <p class="txn__items">${txn.items.map((line) => `${escapeHtml(line.name)} × ${line.qty}`).join(", ")}</p>
            <div class="txn__foot">
              <time datetime="${txn.date}">${formatDate(txn.date)}</time>
              <p>${formatPoints(txn.total)} Poin</p>
            </div>
            ${txn.orderId ? `<a class="text-link txn__track" href="/loyalty/pesanan/?order=${encodeURIComponent(txn.orderId)}">Lacak pesanan</a>` : ""}
          </li>`).join("")
      : `<li class="panel__empty">Belum ada transaksi.</li>`;
  };

  const renderAll = (state = getState()) => {
    renderPicker();
    renderDetail();
    renderCart(state);
    renderActivity(state);
    renderTransactions(state);
  };

  picker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-item]");
    if (!button) return;
    selected = find(button.dataset.item);
    qty = 1;
    detailMessage = "";
    history.replaceState(null, "", `#${selected.id}`);
    renderPicker();
    renderDetail();
  });

  detail.addEventListener("click", (event) => {
    const step = event.target.closest("[data-step]");
    if (step) {
      qty = Math.min(Math.max(qty + Number(step.dataset.step), 1), selected.maxQty);
      detailMessage = "";
      renderDetail();
      return;
    }
    if (!event.target.closest("[data-add]")) return;
    const item = selected;
    const requested = qty;
    qty = 1; // reset before update(), which re-renders the detail panel
    update((state) => {
      const lines = state.carts[shop];
      const line = lines.find((entry) => entry.id === item.id);
      const before = line?.qty ?? 0;
      const after = Math.min(before + requested, item.maxQty);
      if (line) line.qty = after;
      else lines.push({ id: item.id, qty: after });
      detailMessage = after > before
        ? `${item.name} × ${after - before} masuk keranjang.`
        : `Keranjang sudah berisi ${item.maxQty} ${item.name}, batas per penukaran.`;
      if (after > before) logActivity(state, shop, `Menambahkan ${item.name} ke keranjang`);
    });
  });

  // After removing or checking out, the clicked control may be gone or
  // disabled; keep keyboard users in the cart.
  const refocusCart = () => {
    const checkout = cart.querySelector("[data-checkout]");
    (checkout && !checkout.disabled ? checkout : cart.querySelector("#cart-title"))?.focus();
  };

  cart.addEventListener("click", (event) => {
    const row = event.target.closest("[data-line]");
    const step = event.target.closest("[data-step]");
    if (row && step) {
      const item = find(row.dataset.line);
      cartMessage = "";
      update((state) => {
        const line = state.carts[shop].find((entry) => entry.id === item.id);
        line.qty = Math.min(Math.max(line.qty + Number(step.dataset.step), 1), item.maxQty);
      });
      return;
    }
    if (row && event.target.closest("[data-remove]")) {
      const item = find(row.dataset.line);
      cartMessage = `${item.name} dihapus dari keranjang.`;
      update((state) => {
        state.carts[shop] = state.carts[shop].filter((entry) => entry.id !== item.id);
        logActivity(state, shop, `Menghapus ${item.name} dari keranjang`);
      });
      refocusCart();
      return;
    }
    if (event.target.closest("[data-checkout]")) {
      update((state) => {
        const lines = state.carts[shop].map((line) => ({ ...line, item: find(line.id) }));
        const total = lines.reduce((sum, line) => sum + line.qty * line.item.points, 0);
        if (!lines.length || total > state.points) return;
        const now = new Date();
        const stamp = now.toISOString().slice(2, 10).replaceAll("-", "");
        state.points -= total;
        state.transactions.unshift({
          id: `TRX-${stamp}-${String(now.getTime()).slice(-4)}`,
          shop,
          date: now.toISOString(),
          items: lines.map(({ item, qty: count }) => ({ id: item.id, name: item.name, qty: count, points: item.points })),
          total,
          status: isPass ? "Aktif" : "Diproses",
        });
        logActivity(state, shop, `Menukar ${lines.map(({ item }) => item.name).join(", ")}`, -total);
        state.carts[shop] = [];
        cartMessage = `Penukaran berhasil, ${formatPoints(total)} poin terpakai. Detailnya ada di Transaksi.`;
      });
      refocusCart();
    }
  });

  onChange(renderAll);
  renderAll();
};
