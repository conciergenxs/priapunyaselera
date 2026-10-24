// Demo member state. There is no backend yet: accounts (js/auth.js), the
// session and each account's member data (points, carts, transactions,
// activity, finished articles, profile) live in localStorage, or in memory for
// this page view when storage is unavailable. Replace these functions with API
// calls when the member service exists; the pages only use this module's exports.

const KEY = "pps-member-v1"; // + ":<username>" per account
// Read before first paint by js/auth-boot.js; keep the two in sync.
const SESSION_KEY = "pps-session-v1";
const CHANGE = "pps:store-change";

/** Starting balance for new demo accounts. */
const DEMO_START_POINTS = 2000;
/** Bump to reset every saved demo account to DEMO_START_POINTS once. */
const POINTS_RESET = 2;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const emptyMember = () => ({
  profile: { name: "", email: "", phone: "", city: "", memberId: "", tier: "Guild Member", joined: null, avatar: null },
  points: 0,
  carts: { merch: [], pass: [] },
  registeredEvents: [],
  readArticles: [],
  transactions: [],
  activity: [],
});

/** Member data for a newly registered account. */
export const newMember = ({ username, phone }) => {
  const now = new Date();
  const code = [...crypto.getRandomValues(new Uint8Array(4))].map((byte) => CODE_CHARS[byte % CODE_CHARS.length]).join("");
  const member = emptyMember();
  Object.assign(member.profile, {
    name: username,
    phone,
    memberId: `PPS-${now.getFullYear()}-${code}`,
    joined: now.toISOString(),
  });
  member.points = DEMO_START_POINTS;
  member.pointsReset = POINTS_RESET;
  return member;
};

const memory = { session: null, members: {} };

/** Username of the signed-in account, or null when logged out. */
export const currentUser = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw).username ?? null : null;
  } catch {
    return memory.session;
  }
};

const memberKey = (user = currentUser()) => (user ? `${KEY}:${user.toLowerCase()}` : null);

const read = () => {
  const key = memberKey();
  if (!key) return emptyMember(); // logged out: a blank, unsaved guest state
  try {
    const raw = localStorage.getItem(key);
    if (raw) return resetPoints(key, JSON.parse(raw));
  } catch {
    // Storage blocked or corrupt: fall back to memory below.
  }
  return memory.members[key] ?? emptyMember();
};

/** Demo accounts saved before the current POINTS_RESET start over at DEMO_START_POINTS. */
function resetPoints(key, state) {
  if (state.pointsReset === POINTS_RESET) return state;
  state.points = DEMO_START_POINTS;
  state.pointsReset = POINTS_RESET;
  persist(key, state);
  return state;
}

const emit = () => window.dispatchEvent(new CustomEvent(CHANGE, { detail: read() }));

const persist = (key, state) => {
  memory.members[key] = state;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Quota or privacy mode: the in-memory copy still serves this page view.
  }
};

const write = (state) => {
  const key = memberKey();
  if (key) persist(key, state); // guests' changes are never saved
  emit();
};

export const getState = () => read();

/** Apply `mutate(state)` and persist. Returns the new state. */
export const update = (mutate) => {
  const state = read();
  mutate(state);
  write(state);
  return state;
};

/** Store a new account's member data (used by js/auth.js on registration). */
export const saveMember = (username, state) => persist(memberKey(username), state);

/** Sign `username` in, or sign out with null. Member data stays saved per account. */
export const setCurrentUser = (username) => {
  memory.session = username;
  try {
    if (username) localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable: the session lasts for this page view only.
  }
  document.documentElement.dataset.auth = username ? "in" : "out";
  emit();
};

/** Call `listener(state)` whenever the state or the session changes, here or in another tab. */
export const onChange = (listener) => {
  window.addEventListener(CHANGE, (event) => listener(event.detail));
  window.addEventListener("storage", (event) => {
    if (event.key === SESSION_KEY || event.key === memberKey()) listener(read());
  });
};

export const logActivity = (state, shop, text, points = 0) => {
  state.activity.unshift({ id: `ACT-${Date.now()}`, shop, date: new Date().toISOString(), text, points });
};

export const formatPoints = (value) => value.toLocaleString("id-ID");

export const formatDate = (iso, options = { day: "numeric", month: "short", year: "numeric" }) =>
  new Intl.DateTimeFormat("id-ID", options).format(new Date(iso));

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
