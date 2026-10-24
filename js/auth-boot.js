// Runs in <head>, before first paint, on every page.
// 1. Marks <html data-auth="in|out"> so CSS shows the right header (Masuk vs
//    points + profile) without a flash.
// 2. Members-only pages (<meta name="pps-auth" content="required">) send
//    logged-out visitors to Login with a return address.
// 3. Login/Register (<meta name="pps-auth" content="guest">) send signed-in
//    members on to their return address (js/auth.js checks it is same-site).
// Keep the session key in sync with js/store.js.
(() => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("pps-session-v1"))?.username ?? null;
  } catch {
    // Storage blocked: treat as logged out.
  }
  document.documentElement.dataset.auth = user ? "in" : "out";

  const gate = document.querySelector('meta[name="pps-auth"]')?.content;
  if (gate === "required" && !user) {
    const next = location.pathname + location.search + location.hash;
    location.replace(`/masuk/?next=${encodeURIComponent(next)}`);
  } else if (gate === "guest" && user) {
    const next = new URLSearchParams(location.search).get("next") ?? "/";
    // Same-site paths only, and never back to Login/Register (no loops).
    const safe = /^\/(?![\/\\])/.test(next) && !/^\/(masuk|daftar)(\/|$|\?)/.test(next);
    location.replace(safe ? next : "/");
  }
})();
