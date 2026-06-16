import assert from "node:assert/strict";
import fs from "node:fs";

const browserSource = fs.readFileSync(new URL("../js/browser.js", import.meta.url), "utf8");

function functionBody(name) {
  const marker = `function ${name}`;
  const start = browserSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist`);
  const nextFunction = browserSource.indexOf("\n    function ", start + marker.length);
  return browserSource.slice(start, nextFunction === -1 ? undefined : nextFunction);
}

const favoritesToolbar = functionBody("_renderFavoritesToolbar");

assert.ok(
  favoritesToolbar.includes("data-favorite-category-input"),
  "favorites toolbar should offer inline new category input"
);
assert.ok(
  !favoritesToolbar.includes("data-selection-new"),
  "favorites toolbar should not duplicate New Category in the selection controls"
);

const cardsSource = fs.readFileSync(new URL("../js/browser_cards.js", import.meta.url), "utf8");
const stylesSource = fs.readFileSync(new URL("../js/styles.js", import.meta.url), "utf8");

for (const [sourceName, source] of [
  ["browser", browserSource],
  ["cards", cardsSource],
  ["styles", stylesSource],
]) {
  assert.ok(!source.includes("data-selection-"), `${sourceName} should not render selection controls`);
  assert.ok(!source.includes("multiSelect"), `${sourceName} should not keep multi-select state`);
  assert.ok(!source.includes("selectedFavorite"), `${sourceName} should not keep selected favorite state`);
  assert.ok(!source.includes("anima-card-select-toggle"), `${sourceName} should not style card select toggles`);
  assert.ok(!source.includes("multi-selected"), `${sourceName} should not keep old multi-select card styling`);
}

console.log("favorites toolbar UI tests passed");
