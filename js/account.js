// Loaded on every page (directly on the homepage, through js/app.js elsewhere).
// - Header: keeps <html data-auth>, the points balance and the account links
//   in step with the session, here and in other tabs.
// - Login gate: a click on anything marked [data-auth-required] while logged
//   out goes to Login instead, remembering where the member was headed:
//     data-auth-action="merch:cap"  → come back to this page and resume it
//     href="…"                      → otherwise go on to the link's target
import { getState, onChange, formatPoints } from "./store.js";
import { currentUser, authUrl, withAction, LOGIN_PATH } from "./auth.js";

const membersOnly = () => document.querySelector('meta[name="pps-auth"]')?.content === "required";

const paint = (state) => {
  const signedIn = Boolean(currentUser());
  document.documentElement.dataset.auth = signedIn ? "in" : "out";
  document.querySelectorAll("[data-points-balance]").forEach((element) => {
    element.textContent = formatPoints(state.points);
  });
};

// Logged out in another tab while on a members-only page. (Logging out here
// is handled by the page that does it.)
window.addEventListener("storage", () => {
  if (!currentUser() && membersOnly()) location.replace(authUrl(LOGIN_PATH));
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-auth-required]");
  if (!trigger || currentUser()) return;
  // Capture phase: runs before the page's own handlers, which never see the click.
  event.preventDefault();
  event.stopPropagation();
  const { authAction } = trigger.dataset;
  const next = authAction ? withAction(authAction) : trigger.getAttribute("href") ?? undefined;
  location.assign(authUrl(LOGIN_PATH, next));
}, true);

onChange(paint);
paint(getState());
