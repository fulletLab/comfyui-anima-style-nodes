import assert from "node:assert/strict";
import fs from "node:fs";

const swipeSource = fs.readFileSync(new URL("../js/swipe.js", import.meta.url), "utf8");
const browserSource = fs.readFileSync(new URL("../js/browser.js", import.meta.url), "utf8");

assert.ok(
  swipeSource.includes("_pendingFavoriteCategory"),
  "swipe view should keep the selected category as pending state"
);
assert.ok(
  swipeSource.includes("_favoriteCategoryTarget"),
  "swipe view should keep a modal-level save-to category target"
);
assert.ok(
  !swipeSource.includes("item._swipePendingCategory"),
  "save-to category target should not be stored as the current item's real category state"
);
assert.ok(
  !swipeSource.includes("_setFavoriteCategory(e.currentTarget.value)"),
  "changing the swipe category select should not immediately move the favorite"
);
assert.ok(
  swipeSource.includes("_onToggleFavorite(item, favoriteBtn, _pendingFavoriteCategory)"),
  "Favorite/F should submit the pending category"
);
assert.ok(
  swipeSource.includes("Move Category"),
  "favorited items with a different save-to target should show a move-category action label"
);
assert.ok(
  swipeSource.includes("_isChangingFavoriteCategory(item)"),
  "swipe favorite button label should distinguish category moves from unfavorite"
);
assert.ok(
  browserSource.includes("_toggleStyleFavorite(item, anchorEl, categoryName)"),
  "style swipe favorite callback should receive the pending category"
);
assert.ok(
  browserSource.includes("_toggleFulletFavorite(item, anchorEl, categoryName)"),
  "fullet swipe favorite callback should receive the pending category"
);

console.log("swipe favorite category UI tests passed");
