import assert from "node:assert/strict";
import fs from "node:fs";

const autocycleSource = fs.readFileSync(new URL("../js/autocycle.js", import.meta.url), "utf8");

assert.ok(
  !autocycleSource.includes('#anima-browser .anima-card[data-tag]'),
  "Auto Cycle order mode should not read the currently rendered, search-filtered gallery cards",
);

console.log("autocycle order source tests passed");
