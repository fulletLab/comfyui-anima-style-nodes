import assert from "node:assert/strict";
import { getBrowserTemplate } from "../js/browser_template.js";
import { injectCSS } from "../js/styles.js";

const template = getBrowserTemplate("");

const settingsMenu = template.match(/<div class="hdr-settings-menu">([\s\S]*?)<button class="hdr-btn" id="anima-refresh"/)?.[1] || "";

assert.ok(settingsMenu.includes("Remote Images"), "settings menu should use the full Remote Images label");
assert.ok(settingsMenu.includes("Animadex in All"), "settings menu should use the full Animadex in All label");
assert.equal((settingsMenu.match(/class="hdr-switch"/g) || []).length, 2, "primary settings should use matching switch controls");
assert.ok(settingsMenu.includes("Update Styles"), "settings menu should keep full Update Styles action label");
assert.ok(settingsMenu.includes("Download Previews"), "settings menu should keep full Download Previews action label");

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

assert.match(injectedStyle, /\.hdr-settings-menu\s*{[\s\S]*?width:min\(204px, calc\(100vw - 20px\)\)/);
assert.match(injectedStyle, /\.hdr-settings-row\s*{[\s\S]*?min-height:30px/);
assert.match(injectedStyle, /\.hdr-tab-chip\s*{[\s\S]*?min-height:24px/);

console.log("settings menu UI structure tests passed");
