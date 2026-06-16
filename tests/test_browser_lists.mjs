import assert from "node:assert/strict";
import { buildFavoritesList } from "../js/browser_favorites.js";
import { buildGeneratedList } from "../js/browser_generated.js";
import { buildStyleList } from "../js/browser_renderers.js";

const styles = [
  { tag: "beta_style", works: 10, uniqueness_score: 1, addedAt: "2026-01-02T00:00:00Z" },
  { tag: "alpha_style", works: 30, uniqueness_score: 2, addedAt: "2026-01-01T00:00:00Z" },
];

assert.deepEqual(
  buildStyleList(styles, { sort: "latest" }).map((item) => item.tag),
  ["beta_style", "alpha_style"],
);

const generated = buildGeneratedList(styles, [
  { artist: "alpha_style", viewUrl: "/a.png", timestamp: 100 },
  { artist: "beta_style", viewUrl: "/b.png", timestamp: 200 },
], { sort: "latest" });
assert.deepEqual(generated.map((item) => item.tag), ["beta_style", "alpha_style"]);

const mixedGenerated = buildGeneratedList([
  { tag: "new_done", works: 1 },
  { tag: "alpha_empty", works: 5 },
  { tag: "popular_empty", works: 50 },
], [
  { artist: "new_done", viewUrl: "/done.png", timestamp: 300 },
], { sort: "latest" });
assert.deepEqual(
  mixedGenerated.map((item) => item.tag),
  ["new_done", "popular_empty", "alpha_empty"],
);

const favorites = buildFavoritesList({
  artists: styles,
  localFavorites: [
    { kind: "style", tag: "beta_style", works: 10, addedAt: "2026-01-02T00:00:00Z" },
    { kind: "style", tag: "alpha_style", works: 30, addedAt: "2026-01-01T00:00:00Z" },
  ],
  sort: "works",
});
assert.deepEqual(favorites.map((item) => item.tag), ["alpha_style", "beta_style"]);

console.log("browser list sorting tests passed");
