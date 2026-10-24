// Entry point for the inner pages: header account state + login gate (shared
// with the homepage), then only the module the page needs.
import "./account.js";

const modules = {
  "[data-shop]": "./shop.js",
  "[data-events]": "./events.js",
  "[data-articles]": "./article-list.js",
  "[data-article-page]": "./article-reader.js",
  "[data-profile]": "./profile.js",
  "[data-auth-page]": "./auth-page.js",
};

for (const [selector, path] of Object.entries(modules)) {
  const root = document.querySelector(selector);
  if (root) import(path).then((module) => module.init(root));
}
