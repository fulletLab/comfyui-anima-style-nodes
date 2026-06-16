import assert from "node:assert/strict";
import { injectCSS } from "../js/styles.js";

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

assert.match(injectedStyle, /\.cycle-settings-panel\s*{[\s\S]*?box-sizing:border-box/);
assert.match(
  injectedStyle,
  /#anima-browser \.top-search-tools \.anima-sort-select\s*{[^}]*?width:max-content/,
  "sort select should shrink to its option text instead of reserving a wide fixed box"
);
assert.doesNotMatch(
  injectedStyle,
  /#anima-browser \.top-search-tools \.anima-sort-select\s*{[^}]*?width:9[0-9]px/,
  "sort select should not use a wide desktop fixed pixel width"
);
assert.match(
  injectedStyle,
  /#anima-browser \.cycle-search\s*{[^}]*?flex:1 1 clamp\(120px, 16vw, 220px\);[\s\S]*?max-width:220px/,
  "search field should adapt while staying compact on desktop"
);
assert.match(
  injectedStyle,
  /@media \(max-width: 1180px\)\s*{[\s\S]*?#anima-browser \.top-search-tools\.search-open\s*{[\s\S]*?max-width:320px/,
  "search field should not expand back to the old wide layout at tablet widths"
);
assert.match(injectedStyle, /@media \(max-width: 520px\)\s*{[\s\S]*?#anima-browser \.hdr\s*{[\s\S]*?flex-wrap:wrap/);
assert.match(injectedStyle, /@media \(max-width: 520px\)\s*{[\s\S]*?#anima-browser \.hdr-tabs\s*{[\s\S]*?flex:1 0 100%/);
assert.match(injectedStyle, /@media \(max-width: 520px\)\s*{[\s\S]*?#anima-browser \.hdr-settings-menu\s*{[\s\S]*?position:fixed/);

console.log("mobile responsive UI tests passed");
