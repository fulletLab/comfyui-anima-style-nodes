import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stylesSource = readFileSync(new URL("../js/styles.js", import.meta.url), "utf8");
const templateSource = readFileSync(new URL("../js/browser_template.js", import.meta.url), "utf8");
const cardsSource = readFileSync(new URL("../js/browser_cards.js", import.meta.url), "utf8");
const swipeSource = readFileSync(new URL("../js/swipe.js", import.meta.url), "utf8");
const uploadSource = readFileSync(new URL("../js/browser_upload_picker.js", import.meta.url), "utf8");
const browserSource = readFileSync(new URL("../js/browser.js", import.meta.url), "utf8");

for (const token of [
    "--anima-control-bg:var(--anima-surface)",
    "--anima-control-border:var(--anima-border)",
    "--anima-control-fg:var(--anima-text-2)",
    "--anima-control-muted-fg:var(--anima-muted)",
    "--anima-control-hover-bg:var(--anima-accent-soft)",
    "--anima-control-hover-border:var(--anima-accent)",
    "--anima-control-hover-fg:var(--anima-text)",
]) {
    assert.ok(stylesSource.includes(token), `shared control token should exist: ${token}`);
}

assert.match(
    stylesSource,
    /\.anima-control(?:,|\s*\{)/,
    "like controls should share one base control class",
);

assert.match(
    stylesSource,
    /\.anima-control:hover,[\s\S]*\.anima-control\.active \{/,
    "like controls should share one hover/active block",
);

assert.match(
    stylesSource,
    /#anima-swipe\s*{[\s\S]*?--anima-control-bg:var\(--anima-surface,\s*#10182b\)/,
    "swipe mode should inherit theme colors with fallbacks outside #anima-browser",
);

const swipeRule = stylesSource.match(/#anima-swipe\s*{[^}]+}/)?.[0] || "";
assert.ok(!swipeRule.includes("--anima-accent:#7891cf"), "swipe mode should not override dynamic theme accent");
assert.ok(!swipeRule.includes("--anima-bg:#0b0b0f"), "swipe mode should not override dynamic theme background");

const repeatedSurfaceTripletCount = (
    stylesSource.match(/background:var\(--anima-surface\); border:1px solid var\(--anima-border\); color:var\(--anima-(?:text-2|muted)\);/g) ?? []
).length;

assert.ok(
    repeatedSurfaceTripletCount <= 4,
    `surface/border/text button styling should be centralized, found ${repeatedSurfaceTripletCount} repeated triplets`,
);

const controlSources = [
    ["browser template", templateSource],
    ["browser cards", cardsSource],
    ["swipe", swipeSource],
    ["upload picker", uploadSource],
    ["browser runtime", browserSource],
];

for (const [label, source] of controlSources) {
    const actionableControls = source.match(/<(button|select|a)\b(?![^>]*class="[^"]*\banima-control\b)[^>]*(?:class=|data-action=|data-apply=|data-favorite=|href=)/g) ?? [];
    assert.equal(
        actionableControls.length,
        0,
        `${label} actionable controls should use anima-control: ${actionableControls.slice(0, 5).join(" | ")}`,
    );
}

for (const legacySelector of [
    ".cycle-settings-btn",
    ".anima-card-pick",
    ".anima-card-fav",
    ".anima-style-apply-choice",
    ".anima-upload-action",
]) {
    assert.ok(
        !stylesSource.includes(`${legacySelector},`),
        `${legacySelector} should not be part of comma-list shared button styling`,
    );
}

const controlStyleSource = stylesSource
    .replace(/#anima-browser \{[^}]+\}/, "")
    .replace(/\.anima-ac-thumb \{[^}]+\}/g, "")
    .replace(/\.anima-uniqueness-rank \{[^}]+\}/g, "");
const hardCodedControlHeights = controlStyleSource.match(/(?:min-height|height):(?:26|28|29|30|38)px/g) ?? [];
assert.ok(
    hardCodedControlHeights.length <= 3,
    `control heights should use shared variables, found ${hardCodedControlHeights.length}: ${hardCodedControlHeights.join(", ")}`,
);

console.log("shared control style tests passed");
