// Shared data + helpers for the Loyalty redemption flows (merch and Exclusive
// Pass). Prototype only: orders, point deductions and pass redemptions are kept
// in the browser's demo member state (store.js). No backend processes them.
import { catalog } from "./catalog.js";

export const findMerch = (id) => catalog.merch.find((item) => item.id === id);

export const shippingUrl = (itemId) => `/loyalty/tukar/?item=${encodeURIComponent(itemId)}`;
export const successUrl = (orderId) => `/loyalty/tukar/berhasil/?order=${encodeURIComponent(orderId)}`;
export const trackingUrl = (orderId) => `/loyalty/pesanan/?order=${encodeURIComponent(orderId)}`;
/** Order list ("Pesanan Merchandise"); the Profile page links here too. */
export const ORDERS_URL = "/loyalty/pesanan/";

/** Order progress, in order. New orders start at the first step. */
export const ORDER_STEPS = ["Pesanan Diterima", "Pesanan Diproses", "Pesanan Dikirim", "Pesanan Selesai"];

/** Order-list tab + badge for each step (same order as ORDER_STEPS). */
export const ORDER_TABS = [
  { key: "menunggu", label: "Menunggu Diproses" },
  { key: "diproses", label: "Diproses" },
  { key: "dikirim", label: "Dikirim" },
  { key: "selesai", label: "Selesai" },
];

export const orderTab = (order) => ORDER_TABS[Math.max(ORDER_STEPS.indexOf(order.status), 0)];

export const PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan",
  "Kepulauan Bangka Belitung", "Bengkulu", "Lampung", "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah",
  "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
  "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara",
  "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku",
  "Maluku Utara", "Papua", "Papua Barat", "Papua Barat Daya", "Papua Selatan", "Papua Tengah", "Papua Pegunungan",
];

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I look-alikes

/** Random reference like PPS-ORD-7KQ2MX, unique among `taken`. */
export const newReference = (prefix, taken = []) => {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const code = [...bytes].map((byte) => CODE_CHARS[byte % CODE_CHARS.length]).join("");
    const id = `${prefix}-${code}`;
    if (!taken.includes(id)) return id;
  }
};

export const findOrder = (state, id) => (state.orders ?? []).find((order) => order.id === id);

export const addressSummary = (address) =>
  `${address.street}, Kec. ${address.district}, ${address.city}, ${address.province} ${address.postal}`;

export const merchImage = (item, size = 800) => `${item.image}-${size}.webp`;

/** Indonesian mobile number: 08…, 628… or +628…, 10–15 digits after the prefix rules. */
export const isIndonesianMobile = (value) => /^(?:\+62|62|0)8\d{7,11}$/.test(value.replace(/[\s-]/g, ""));

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
