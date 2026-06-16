import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const browserSource = readFileSync(new URL("../js/browser.js", import.meta.url), "utf8");

const styleToggle = browserSource.match(/async function _toggleStyleFavorite[\s\S]*?async function _toggleFulletFavorite/)?.[0] || "";
const fulletToggle = browserSource.match(/async function _toggleFulletFavorite[\s\S]*?async function _loadFulletPrompts/)?.[0] || "";

assert.ok(
  styleToggle.includes("removeFromFavoritesView: category === \"favorites\" && !nextState"),
  "style unfavorite in Favorites should lazily remove the card instead of reloading the page",
);
assert.ok(
  fulletToggle.includes("removeFromFavoritesView: category === \"favorites\" && !nextState"),
  "Fullet unfavorite in Favorites should lazily remove the card instead of reloading the page",
);
assert.ok(
  !styleToggle.includes("if (category === \"favorites\") {\n            await _renderFavorites({ preservePage: true });"),
  "style unfavorite should not force a full Favorites reload",
);
assert.ok(
  !fulletToggle.includes("if (category === \"favorites\") {\n            _remoteFavoritesLoaded = false;\n            await _renderFavorites({ preservePage: true });"),
  "Fullet unfavorite should not force a full Favorites reload",
);

console.log("favorites lazy removal UI tests passed");
