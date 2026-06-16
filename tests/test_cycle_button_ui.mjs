import assert from "node:assert/strict";
import fs from "node:fs";
import { getBrowserTemplate } from "../js/browser_template.js";
import { injectCSS } from "../js/styles.js";

const template = getBrowserTemplate("");
assert.ok(
  template.includes('<span class="btn-icon" aria-hidden="true">▶️</span>'),
  "cycle button should default to the play emoji",
);

let injectedStyle = null;
global.document = {
  getElementById: () => null,
  createElement: () => ({ id: "", textContent: "" }),
  head: {
    appendChild: (node) => {
      injectedStyle = node.textContent;
    },
  },
};

injectCSS();

assert.match(injectedStyle, /\.anima-play-btn \.btn-icon\s*{[\s\S]*?font-size:13px/);
assert.match(injectedStyle, /\.anima-play-btn \.btn-lbl\s*{\s*display:none;\s*}/);
assert.match(injectedStyle, /\.anima-cycle-status\s*{[\s\S]*?max-width:none/);
assert.match(injectedStyle, /\.anima-cycle-status\s*{[\s\S]*?overflow:visible/);

const autocycleSource = fs.readFileSync(new URL("../js/autocycle.js", import.meta.url), "utf8");
assert.ok(autocycleSource.includes('textContent = "⏸️"'), "running state should use the pause emoji");
assert.ok(autocycleSource.includes('textContent = "▶️"'), "stopped state should use the play emoji");
assert.ok(
  !autocycleSource.includes("&#9646;&#9646;"),
  "running state should not inject block glyphs for the pause icon",
);
assert.ok(
  autocycleSource.includes('.replace(/^(\\d+)\\s+records\\s+-\\s+/i, (_, count) => `${count} - `)'),
  "cycle status should keep full record counts instead of compacting to k/m",
);
assert.ok(
  !autocycleSource.includes("compactCount"),
  "cycle status should not use compact count labels",
);

console.log("cycle button UI tests passed");
