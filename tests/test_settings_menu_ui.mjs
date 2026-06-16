import assert from "node:assert/strict";
import { getBrowserTemplate } from "../js/browser_template.js";
import { injectCSS } from "../js/styles.js";

const template = getBrowserTemplate("");

const settingsMenu = template.match(/<div class="hdr-settings-menu">([\s\S]*?)<button class="[^"]*\bhdr-btn\b[^"]*" id="anima-refresh"/)?.[1] || "";

assert.ok(settingsMenu.includes("Remote Images"), "settings menu should use the full Remote Images label");
assert.ok(settingsMenu.includes("Animadex in All"), "settings menu should use the full Animadex in All label");
assert.ok(settingsMenu.includes("Theme Colors"), "settings menu should group theme colors in one panel");
assert.ok(!settingsMenu.includes("Theme Preset"), "settings menu should remove theme presets");
assert.ok(!settingsMenu.includes("id=\"anima-theme-preset\""), "settings menu should not include the theme preset select");
assert.ok(!settingsMenu.includes("<option value=\"dark\">Dark</option>"), "theme preset dark option should be removed");
assert.ok(!settingsMenu.includes("<option value=\"light\">Light</option>"), "theme preset light option should be removed");
assert.ok(!settingsMenu.includes("Sapphire"), "theme presets should not include built-in colors");
assert.ok(!settingsMenu.includes("Violet"), "theme presets should not include built-in colors");
assert.ok(!settingsMenu.includes("Rose"), "theme presets should not include built-in colors");
assert.ok(settingsMenu.includes("Theme Color"), "settings menu should expose custom theme color");
assert.ok(settingsMenu.includes("id=\"anima-theme-color\""), "settings menu should include the theme color input");
assert.ok(settingsMenu.includes("Overlay Color"), "settings menu should expose custom overlay color");
assert.ok(settingsMenu.includes("id=\"anima-overlay-color\""), "settings menu should include the overlay color input");
assert.ok(settingsMenu.includes("Highlight Color"), "settings menu should expose custom highlight color");
assert.ok(settingsMenu.includes("id=\"anima-highlight-color\""), "settings menu should include the highlight color input");
assert.ok(!settingsMenu.includes("Light Theme"), "settings menu should replace the old Light Theme toggle");
assert.ok(!settingsMenu.includes("id=\"anima-light-theme\""), "settings menu should not include the old light theme checkbox");
assert.ok(settingsMenu.includes("Columns"), "settings menu should expose a grid columns control");
assert.ok(settingsMenu.includes("id=\"anima-grid-columns\""), "settings menu should include the grid columns select");
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
assert.match(injectedStyle, /#anima-browser\s*{[\s\S]*?--anima-accent:#7891cf/);
assert.match(injectedStyle, /\.anima-play-btn\s*{[\s\S]*?background:var\(--anima-accent-soft\)/);
assert.match(injectedStyle, /\.anima-control:hover,\s*\.anima-control\.active\s*{[\s\S]*?background:var\(--anima-control-hover-bg/);
assert.match(injectedStyle, /--anima-control-radius:8px/);
assert.match(injectedStyle, /--anima-control-height:30px/);
assert.match(injectedStyle, /--anima-control-padding:6px 10px/);
assert.match(injectedStyle, /--anima-select-padding:6px 24px 6px 10px/);
assert.match(injectedStyle, /select\.anima-control,\s*#anima-browser \.hdr-select\s*{[\s\S]*?width:max-content;[\s\S]*?min-width:max-content;[\s\S]*?padding:var\(--anima-select-padding\)/);
assert.match(injectedStyle, /\.anima-control,\s*#anima-browser input\[type="text"\],\s*#anima-browser input\[type="search"\],\s*#anima-browser input\[type="number"\],\s*#anima-browser textarea\s*{[\s\S]*?padding:var\(--anima-control-padding\);[\s\S]*?border-radius:var\(--anima-control-radius\)/);
assert.match(template, /<select class="anima-control hdr-select anima-prompt-select" id="anima-cycle-subject">/);
assert.match(injectedStyle, /#anima-browser \.anima-prompt-subject select\s*{[\s\S]*?width:100%;[\s\S]*?min-height:var\(--anima-control-height\)/);
assert.match(injectedStyle, /\.anima-favorites-toolbar select\s*{\s*max-width:min\(260px, 45vw\);\s*}/);
assert.match(injectedStyle, /\.hdr-settings-select-row select\s*{\s*max-width:100%;\s*}/);
assert.match(injectedStyle, /\.hdr-theme-colors\s*{[\s\S]*?border:1px solid var\(--anima-border\)/);
assert.match(injectedStyle, /\.hdr-theme-colors-title\s*{[\s\S]*?color:var\(--anima-text\)/);
assert.match(injectedStyle, /\.hdr-settings-row\s*{[\s\S]*?min-height:30px/);
assert.match(injectedStyle, /\.hdr-tab-chip\s*{[\s\S]*?min-height:24px/);
assert.match(injectedStyle, /\.anima-chunk\s*{[\s\S]*?grid-template-columns:repeat\(var\(--anima-grid-columns, 4\), minmax\(0, 1fr\)\)/);
const animaChunkRule = injectedStyle.match(/\.anima-chunk\s*{\s*display:grid;[^}]*}/)?.[0] || "";
assert.match(animaChunkRule, /gap:2px/);
assert.match(injectedStyle, /@media \(max-width: 520px\)\s*{[\s\S]*?\.anima-chunk\s*{[\s\S]*?grid-template-columns:repeat\(var\(--anima-grid-mobile-columns, 2\), minmax\(0, 1fr\)\)/);
assert.doesNotMatch(injectedStyle, /\.anima-card-img\s*{[^}]*aspect-ratio:1/);
assert.match(injectedStyle, /\.anima-card-img img\s*{[\s\S]*?height:auto;[\s\S]*?object-fit:contain/);
assert.match(injectedStyle, /\.anima-card-img\.no-img\s*{[\s\S]*?aspect-ratio:1/);
assert.match(injectedStyle, /\.anima-card\s*{[\s\S]*?position:relative/);
assert.match(injectedStyle, /\.anima-card-meta\s*{[\s\S]*?position:absolute;[\s\S]*?opacity:0/);
assert.match(injectedStyle, /\.anima-card:hover \.anima-card-meta,\s*\.anima-card:focus-within \.anima-card-meta\s*{[\s\S]*?opacity:1/);
assert.match(injectedStyle, /\.anima-card\.favorited\s*{[\s\S]*?border-width:2px;[\s\S]*?box-shadow:inset 0 0 0 4px var\(--anima-accent-ring\)/);
assert.match(injectedStyle, /\.anima-fullet-card\.favorited\s*{[\s\S]*?border-width:2px;[\s\S]*?box-shadow:inset 0 0 0 4px var\(--anima-accent-ring\)/);
assert.doesNotMatch(injectedStyle, /\.anima-card\.favorited::before/);
assert.doesNotMatch(injectedStyle, /\.anima-card\.favorited \.anima-card-img::before/);
assert.match(injectedStyle, /#anima-swipe\.favorited \.swipe-title::after\s*{[\s\S]*?background:var\(--anima-accent-soft\)/);
assert.match(injectedStyle, /\.anima-card-removing\s*{[\s\S]*?opacity:\.35/);
assert.match(injectedStyle, /\.anima-card-img\.is-loading\s*{[\s\S]*?min-height:180px/);
assert.match(injectedStyle, /\.anima-card-img\.is-loading img\s*{[\s\S]*?opacity:0/);
assert.match(injectedStyle, /#anima-browser \.ftr\s*{[\s\S]*?grid-template-columns:1fr auto 1fr/);
assert.match(injectedStyle, /#anima-browser \.ftr-count\s*{[\s\S]*?grid-column:1/);
assert.match(injectedStyle, /#anima-browser \.anima-page-jump\s*{[\s\S]*?grid-column:2/);
assert.match(injectedStyle, /#anima-browser \.anima-page-jump input\s*{[\s\S]*?width:3ch/);
assert.match(injectedStyle, /#anima-browser \.anima-page-jump input\s*{[\s\S]*?line-height:var\(--anima-control-height\)/);
assert.match(injectedStyle, /#anima-browser \.anima-page-jump input\[type="number"\]::-webkit-inner-spin-button\s*{[\s\S]*?-webkit-appearance:none/);
assert.match(injectedStyle, /\.anima-control,[\s\S]*?{[\s\S]*?background:var\(--anima-control-bg/);
assert.match(injectedStyle, /\.hdr-settings-menu\s*{[\s\S]*?background:var\(--anima-panel\)/);
assert.match(injectedStyle, /#anima-browser #anima-prompt-editor\s*{[\s\S]*?background:var\(--anima-surface\)/);
assert.match(injectedStyle, /\.anima-favorites-toolbar\s*{[\s\S]*?background:var\(--anima-panel\)/);
assert.match(injectedStyle, /\.ftr-info-btn/);
assert.match(injectedStyle, /#anima-browser \.ftr-info-menu\s*{[\s\S]*?font-family:'JetBrains Mono',monospace;[\s\S]*?font-size:var\(--anima-font-ui\);[\s\S]*?font-weight:600/);
assert.match(injectedStyle, /#anima-browser \.ftr-info-menu span,\s*#anima-browser \.ftr-info-menu a\s*{[\s\S]*?font:inherit/);
assert.match(injectedStyle, /#anima-browser \.ftr-info-menu > a\.anima-control\s*{[\s\S]*?display:block/);
assert.doesNotMatch(injectedStyle, /backdrop-filter/, "main UI should avoid backdrop blur for better scroll performance");
assert.doesNotMatch(injectedStyle, /filter:blur/, "image-heavy UI should avoid blur filters");
assert.doesNotMatch(injectedStyle, /transition:all/, "UI transitions should target specific cheap properties");
assert.doesNotMatch(injectedStyle, /\.anima-card:hover\s*{[^}]*transform:/, "gallery cards should avoid hover transforms");
assert.doesNotMatch(injectedStyle, /\.anima-card:hover \.anima-card-img img\s*{[^}]*transform:/, "gallery images should avoid hover scaling");
assert.doesNotMatch(injectedStyle, /theme-light/, "old light theme override class should be removed");

console.log("settings menu UI structure tests passed");
