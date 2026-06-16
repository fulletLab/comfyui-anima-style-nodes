import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stylesSource = readFileSync(new URL("../js/styles.js", import.meta.url), "utf8");
const browserSource = readFileSync(new URL("../js/browser.js", import.meta.url), "utf8");
const cardSource = readFileSync(new URL("../js/browser_cards.js", import.meta.url), "utf8");

for (const selector of [
    ".hdr-pill",
    ".search-wrap",
    ".search-icon",
    ".search-input",
    ".cycle-gap",
    ".cycle-hint",
    ".cycle-check",
    ".anima-toolbar-divider",
    ".hdr-settings-toggle",
    ".hdr-toggle-hint",
    ".hdr-toggle-label",
    ".anima-card-action-list",
    ".anima-card-remove-generated",
    ".anima-generated-toolbar",
    ".anima-generated-include-images",
    ".ftr-link",
    ".anima-fullet-prompt",
    ".anima-key-hint",
]) {
    assert.ok(!stylesSource.includes(selector), `unused selector should be removed: ${selector}`);
}

assert.ok(!cardSource.includes("editMode"), "unreachable card edit mode should be removed");
assert.ok(!cardSource.includes("data-remove-generated"), "unreachable remove generated button should be removed");
assert.ok(!cardSource.includes("onRemoveGenerated"), "unreachable remove generated card callback should be removed");
assert.ok(!browserSource.includes("onRemoveGenerated"), "browser should not pass an unreachable remove generated callback");
assert.ok(!browserSource.includes("editMode: false"), "browser should not pass a hard-coded disabled edit mode");

console.log("unused UI cleanup tests passed");
