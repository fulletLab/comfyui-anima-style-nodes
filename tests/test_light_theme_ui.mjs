import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const browserSource = readFileSync(new URL("../js/browser.js", import.meta.url), "utf8");

assert.ok(browserSource.includes("anima_light_theme_v1"), "old light theme preference should be read for migration");
assert.ok(browserSource.includes("anima_theme_color_v1"), "theme color preference should use a stable localStorage key");
assert.ok(browserSource.includes("anima_overlay_color_v1"), "overlay color preference should use a stable localStorage key");
assert.ok(browserSource.includes("anima_highlight_color_v1"), "highlight color preference should use a stable localStorage key");
assert.ok(!browserSource.includes("anima_theme_preset_v1"), "theme preset preference should be removed");
assert.ok(!browserSource.includes("theme-light"), "browser should not use a separate light theme override class");
assert.ok(!browserSource.includes("#anima-light-theme"), "browser should not bind the removed light theme setting control");
assert.ok(browserSource.includes("#anima-theme-color"), "browser should bind the theme color picker");
assert.ok(browserSource.includes("#anima-overlay-color"), "browser should bind the overlay color picker");
assert.ok(browserSource.includes("#anima-highlight-color"), "browser should bind the highlight color picker");
assert.ok(!browserSource.includes("#anima-theme-preset"), "browser should not bind a theme preset picker");
assert.ok(browserSource.includes("--anima-accent"), "browser should apply the chosen accent as a CSS variable");
assert.ok(browserSource.includes("--anima-bg"), "browser should apply generated background color variables");
assert.ok(browserSource.includes("--anima-panel"), "browser should apply generated panel color variables");
assert.ok(browserSource.includes("baseColor"), "theme generation should separate base color from highlight color");
assert.ok(browserSource.includes("overlayColor"), "theme generation should separate overlay color from base and highlight colors");
assert.ok(browserSource.includes("accentColor"), "theme generation should separate highlight color from base color");
assert.ok(browserSource.includes("_isLightThemeColor"), "theme generation should infer light/dark contrast from the chosen base color");
assert.ok(!browserSource.includes("THEME_PRESETS"), "theme mode presets should not carry built-in colors");
assert.ok(!browserSource.includes("dark-sapphire"), "theme mode presets should not lock the user's colors");
assert.ok(browserSource.includes('_setThemeVariable("--anima-bg", base)'), "theme color should directly control the main background");

console.log("light theme UI behavior tests passed");
