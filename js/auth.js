// Demo accounts: register, log in, log out, and the return-address helpers the
// login gate uses. PROTOTYPE BYPASS: any non-empty input signs in. A known
// username or WhatsApp number opens that account; anything else creates one on
// the spot. Passwords are never checked or stored. Accounts and member data
// live in this browser's localStorage only. Replace with the PPS account
// service (real registration + password check) before launch.
import { currentUser, setCurrentUser, newMember, saveMember } from "./store.js";
import { isIndonesianMobile } from "./redeem-data.js";

const ACCOUNTS_KEY = "pps-accounts-v1";

export const LOGIN_PATH = "/masuk/";
export const REGISTER_PATH = "/daftar/";

/** Query parameter that carries an action to resume after login (e.g. "merch:cap"). */
const ACTION_PARAM = "lanjut";

export { currentUser };

/* Accounts ---------------------------------------------------------------- */

let memoryAccounts = [];

const readAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) ?? [];
  } catch {
    return memoryAccounts;
  }
};

const writeAccounts = (accounts) => {
  memoryAccounts = accounts;
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Storage unavailable: the account lasts for this page view only.
  }
};

/** 0812-3456 7890, +62 812…, 62812… → 628123456789. */
const normalizePhone = (value) => value.replace(/[\s-]/g, "").replace(/^\+/, "").replace(/^0/, "62");

const findAccount = (identifier) => {
  const lower = identifier.trim().toLowerCase();
  const phone = normalizePhone(identifier.trim());
  return readAccounts().find((account) => account.username.toLowerCase() === lower || (account.phone && account.phone === phone));
};

/** Sign in as the matching account, creating it first when there is none. */
const signIn = (username, phone = "") => {
  const account = findAccount(username);
  if (account) {
    setCurrentUser(account.username);
    return;
  }
  writeAccounts([...readAccounts(), { username, phone: phone ? normalizePhone(phone) : "" }]);
  saveMember(username, newMember({ username, phone }));
  setCurrentUser(username);
};

/* Session ----------------------------------------------------------------- */

export const register = ({ username, phone }) => signIn(username.trim(), phone.trim());

/** Username or WhatsApp number; the password is not checked (prototype). */
export const login = ({ identifier }) => {
  const value = identifier.trim();
  if (isIndonesianMobile(value)) signIn(findAccount(value)?.username ?? value, value);
  else signIn(value);
};

export const logout = () => setCurrentUser(null);

/* Return address + pending action ---------------------------------------- */

const here = () => location.pathname + location.search + location.hash;

/** A same-site path to return to after login; never the login/register pages. */
export const safeNext = (value) => {
  if (!value) return "/";
  try {
    const url = new URL(value, location.origin);
    if (url.origin !== location.origin) return "/";
    if ([LOGIN_PATH, REGISTER_PATH].some((path) => url.pathname.startsWith(path.slice(0, -1)))) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
};

/** /masuk/ or /daftar/ with a return address (defaults to the current page). */
export const authUrl = (path, next = here()) => {
  const target = safeNext(next);
  return target === "/" ? path : `${path}?next=${encodeURIComponent(target)}`;
};

/** The current page with `action` queued to run once the member is back. */
export const withAction = (action) => {
  const url = new URL(location.href);
  url.searchParams.delete(ACTION_PARAM);
  // Keep ":" readable (lanjut=merch:cap); it needs no escaping in a query.
  const param = `${ACTION_PARAM}=${encodeURIComponent(action).replace(/%3A/gi, ":")}`;
  return `${url.pathname}${url.search}${url.search ? "&" : "?"}${param}${url.hash}`;
};

/** Read and clear this page's queued action (only for a signed-in member). */
export const takeAction = () => {
  const url = new URL(location.href);
  const action = url.searchParams.get(ACTION_PARAM);
  if (!action) return null;
  url.searchParams.delete(ACTION_PARAM);
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  return currentUser() ? action : null;
};
