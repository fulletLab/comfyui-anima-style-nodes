import { app } from "../../scripts/app.js";
import { CDN_BASE } from "./config.js";

const CHARACTER_PARTS_PROP = "_anima_character_parts";

export function remoteImagesEnabled() {
    try {
        return localStorage.getItem("anima_online") === "true";
    } catch {
        return false;
    }
}

export function thumbUrl(artist, useCustom = false) {
    if (!artist) return "";
    const id = artist.id ?? "";
    const isOnline = remoteImagesEnabled();

    const direct = String(
        artist.thumb_url
        || artist.thumbnailUrl
        || artist.imageUrl
        || artist.image
        || ""
    ).trim();
    if (direct) {
        if (/^https?:\/\//i.test(direct) && !isOnline) return "";
        return direct;
    }

    if (!id) return "";

    if (useCustom) {
        return `/anima/images/custom/${id}.webp`;
    }

    const page = artist.p ?? 1;
    const preferLocal = !!(artist?._preferLocalThumb || artist?.localPreviewCached);
    if (preferLocal) {
        return `/anima/images/${page}/${id}.webp`;
    }

    if (!isOnline) {
        return `/anima/images/${page}/${id}.webp`;
    }

    return `${CDN_BASE}/images/${page}/${id}.webp`;
}

export function getPromptWidget(node) {
    return node.widgets?.find(w =>
        w.name === "text" ||
        w.name === "prompt" ||
        w.type === "customtext" ||
        (w.type === "STRING" && w.inputEl)
    ) ?? null;
}

function promptContainsTag(value = "", tag = "") {
    const raw = String(value || "").toLowerCase();
    const display = String(tag || "")
        .replace(/^@+/, "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    if (!raw || !display) return false;
    const escaped = display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[,\\s])@${escaped}(?=\\s*,|\\s*$|$)`, "i").test(raw);
}

export function syncPromptTagState(node, value = "") {
    if (!node?._currentTag || promptContainsTag(value, node._currentTag)) return;
    node._currentTag = "";
    node._currentTagKind = "";
    const badge = document.getElementById("anima-badge");
    if (badge) {
        badge.textContent = "";
        badge.style.display = "none";
    }
    node.setDirtyCanvas?.(true, true);
    app.graph.setDirtyCanvas?.(true, true);
}

export function setPromptValue(node, w, value, tag = "", kind = "") {
    w.value = value;
    if (w.inputEl) {
        w.inputEl.value = value;
        w.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        w.inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (w.callback) w.callback(value);

    const badge = document.getElementById("anima-badge");
    const cleanTag = String(tag || "").replace(/^@+/, "").trim();
    const shouldKeepTag = !!cleanTag && promptContainsTag(value, cleanTag);

    if (shouldKeepTag) {
        node._currentTag = cleanTag;
        if (kind) node._currentTagKind = kind;
    } else if (node?._currentTag && !promptContainsTag(value, node._currentTag)) {
        syncPromptTagState(node, value);
    }

    if (badge && shouldKeepTag) {
        const displayTag = cleanTag.replace(/_/g, " ");
        const displayKind = String(kind || node?._currentTagKind || "style").toUpperCase();
        badge.textContent = `${displayKind} @${displayTag}`;
        badge.style.display = "block";
    }

    node.setDirtyCanvas?.(true, true);
    app.graph.setDirtyCanvas?.(true, true);
}

function normalizeArtist(value = "") {
    const display = String(value || "")
        .replace(/^@+/, "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return {
        display,
        tag: display ? display.replace(/\s+/g, "_") : "",
        token: display ? `@${display}` : "",
    };
}

function getFirstArtistToken(text = "") {
    const match = String(text || "").match(/@[^,\n]+/);
    return match ? match[0].trim() : "";
}

function artistTokenToTag(token = "") {
    return String(token || "")
        .replace(/^@+/, "")
        .replace(/\s+/g, "_")
        .trim();
}

function composeArtistAndPrompt(artistToken = "", promptText = "") {
    const a = String(artistToken || "").trim().replace(/[\s,]+$/g, "");
    const p = String(promptText || "").trim().replace(/^[,\s]+/g, "");
    if (a && p) return `${a}, ${p}`;
    return a || p;
}

function resolvePreservedArtist(current = "", fallbackTag = "") {
    const existingArtistToken = getFirstArtistToken(current);
    if (existingArtistToken) {
        return {
            token: existingArtistToken,
            tag: artistTokenToTag(existingArtistToken),
        };
    }

    const fallback = normalizeArtist(fallbackTag);
    return {
        token: fallback.token,
        tag: fallback.tag,
    };
}

const ARTIST_LINE_RE = /(^|\n)(\s*(?:artist|artista|author|autor)\s*:\s*)([^\n]*)/i;
const PROMPT_LINE_RE = /(^|\n)(\s*(?:prompt|positive\s*prompt|prompt\s*positivo)\s*:\s*)([^\n]*)/i;

function replaceLabeledLine(text, lineRegex, value) {
    let changed = false;
    const next = String(text || "").replace(lineRegex, (_m, prefix, label) => {
        changed = true;
        return `${prefix}${label}${value}`;
    });
    return { text: next, changed };
}

function applyStructuredFields(current, { artistToken = "", promptText = "", updateArtist = false, updatePrompt = false } = {}) {
    let next = String(current || "");
    let changed = false;

    if (updateArtist) {
        const result = replaceLabeledLine(next, ARTIST_LINE_RE, artistToken);
        next = result.text;
        changed = changed || result.changed;
    }

    if (updatePrompt) {
        const result = replaceLabeledLine(next, PROMPT_LINE_RE, promptText);
        next = result.text;
        changed = changed || result.changed;
    }

    return changed ? next : null;
}

function looksStructuredPrompt(text = "") {
    const raw = String(text || "");
    if (!raw) return false;
    if (/\n/.test(raw)) return true;
    return /(^|\s)[a-zA-Z][a-zA-Z0-9 _-]{1,28}:\s/.test(raw);
}

export function injectTag(current, tag) {
    const text = String(current || "");
    const spaceTag = tag ? tag.replace(/_/g, " ") : "";

    if (!spaceTag) {
        return text.replace(/(^|,\s*)@[^,\n]+(,\s*|$)/g, (_match, p1, p2) => p1 && p2 ? ", " : "").trim();
    }

    if (/@[^,\n]+/.test(text)) {
        return text.replace(/@[^,\n]+(,\s*)?/, `@${spaceTag}, `);
    }

    const cleaned = text.trim().replace(/[\s,]+$/g, "");
    return cleaned ? `${cleaned}, @${spaceTag}, ` : `@${spaceTag}, `;
}

function styleDisplayTag(tag = "") {
    return String(tag || "")
        .replace(/^@+/, "")
        .replace(/\\([()])/g, "$1")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function splitPromptTagList(value = []) {
    const raw = Array.isArray(value) ? value : [value];
    return raw
        .flatMap((item) => String(item || "").split(","))
        .map((part) => part
            .replace(/^@+/, "")
            .replace(/\\([()])/g, "$1")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim())
        .filter(Boolean);
}

function stylePromptToken(tag = "") {
    const display = styleDisplayTag(tag);
    return display ? `@${display}` : "";
}

function promptParts(current = "") {
    return String(current || "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
}

function joinPromptParts(parts = []) {
    const next = (Array.isArray(parts) ? parts : [])
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(", ");
    return next ? `${next}, ` : "";
}

export function getStylePromptSlotsFromText(current = "") {
    const parts = promptParts(current);
    return parts
        .map((part, partIndex) => {
            if (!String(part || "").trim().startsWith("@")) return null;
            const display = styleDisplayTag(part);
            if (!display) return null;
            return {
                partIndex,
                token: stylePromptToken(display),
                tag: display,
                label: `@${display}`,
            };
        })
        .filter(Boolean);
}

export function getStylePromptSlots(node) {
    const widget = getPromptWidget(node);
    return getStylePromptSlotsFromText(widget ? String(widget.value || "") : "");
}

function getStyleTokensFromText(current = "") {
    return getStylePromptSlotsFromText(current).map((slot) => slot.token);
}

function applyStyleTokenAction(current = "", tag = "", action = "", replaceIndex = -1) {
    const token = stylePromptToken(tag);
    if (!token) return String(current || "");

    const parts = promptParts(current);
    const styleIndexes = [];
    parts.forEach((part, index) => {
        if (String(part || "").trim().startsWith("@")) styleIndexes.push(index);
    });

    const normalizedToken = normalizePromptPart(token);
    const hasToken = parts.some((part) => normalizePromptPart(part) === normalizedToken);

    if (action === "add") {
        if (!hasToken) {
            let insertAt = 0;
            if (parts.length && String(parts[0] || "").trim().startsWith("@")) {
                while (insertAt < parts.length && String(parts[insertAt] || "").trim().startsWith("@")) insertAt++;
            } else if (styleIndexes.length) {
                insertAt = styleIndexes[styleIndexes.length - 1] + 1;
            }
            parts.splice(insertAt, 0, token);
        }
        return joinPromptParts(parts);
    }

    if (action === "replace-index") {
        const index = styleIndexes[Number.parseInt(replaceIndex, 10)];
        if (Number.isInteger(index)) {
            parts[index] = token;
        } else if (!hasToken) {
            parts.unshift(token);
        }
        return joinPromptParts(parts);
    }

    if (action === "replace-all") {
        if (!styleIndexes.length) return joinPromptParts([token, ...parts]);
        const firstStyleIndex = styleIndexes[0];
        const kept = parts.filter((_, index) => !styleIndexes.includes(index));
        kept.splice(Math.min(firstStyleIndex, kept.length), 0, token);
        return joinPromptParts(kept);
    }

    return injectStyleTagGroup(current, [tag]);
}

function injectStyleTagGroup(current = "", tags = []) {
    const displays = (Array.isArray(tags) ? tags : [])
        .map(styleDisplayTag)
        .filter(Boolean);
    if (!displays.length) return String(current || "");

    const tokens = displays.map(stylePromptToken).filter(Boolean);
    const tokenText = tokens.join(", ");
    const text = String(current || "").trim();

    if (!text) return `${tokenText}, `;

    if (/^\s*@/.test(text)) {
        const parts = text.split(",");
        while (parts.length && parts[0].trim().startsWith("@")) {
            parts.shift();
        }
        const rest = parts.join(",").trim().replace(/^[,\s]+/g, "");
        return rest ? `${tokenText}, ${rest}` : `${tokenText}, `;
    }

    if (/@[^,\n]+/.test(text)) {
        return text.replace(/@[^,\n]+(,\s*)?/, `${tokenText}, `);
    }

    return `${tokenText}, ${text.replace(/^[,\s]+/g, "")}`;
}

function sourceKindFromArtist(artist) {
    const kind = String(artist?.source_kind || "").toLowerCase();
    return kind === "character" ? "character" : "style";
}

function appendPromptTags(current = "", tags = []) {
    return appendPromptTagsDetailed(current, tags).prompt;
}

function appendPromptTagsDetailed(current = "", tags = []) {
    const text = String(current || "");
    const existing = new Set(
        text
            .split(",")
            .map((part) => normalizePromptPart(part))
            .filter(Boolean)
    );
    const cleanedTags = [];
    const requestedTags = [];

    for (const tag of splitPromptTagList(tags)) {
        const display = String(tag || "").trim();
        const key = display.toLowerCase();
        if (!display) continue;
        requestedTags.push(display);
        if (existing.has(key)) continue;
        existing.add(key);
        cleanedTags.push(display);
    }

    if (!cleanedTags.length) return { prompt: text, inserted: requestedTags };

    const cleaned = text.trim().replace(/[\s,]+$/g, "");
    const suffix = cleanedTags.join(", ");
    return {
        prompt: cleaned ? `${cleaned}, ${suffix}, ` : `${suffix}, `,
        inserted: requestedTags,
    };
}

function normalizePromptPart(value = "") {
    return String(value || "")
        .replace(/^@+/, "")
        .replace(/\\([()])/g, "$1")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function removePromptTagSequence(current = "", tags = []) {
    const wanted = splitPromptTagList(tags)
        .map((tag) => normalizePromptPart(tag))
        .filter(Boolean);
    if (!wanted.length) return String(current || "");

    const parts = String(current || "").split(",").map((part) => part.trim());
    const normalized = parts.map((part) => normalizePromptPart(part));

    for (let i = 0; i <= normalized.length - wanted.length; i++) {
        const matches = wanted.every((tag, offset) => normalized[i + offset] === tag);
        if (!matches) continue;
        parts.splice(i, wanted.length);
        const next = parts.map((part) => part.trim()).filter(Boolean).join(", ");
        return next ? `${next}, ` : "";
    }

    return String(current || "");
}

function removePromptTagSet(current = "", tags = []) {
    const wanted = new Set(
        splitPromptTagList(tags)
            .map((tag) => normalizePromptPart(tag))
            .filter(Boolean)
    );
    if (!wanted.size) return String(current || "");

    const parts = String(current || "").split(",").map((part) => part.trim());
    const kept = parts.filter((part) => {
        const key = normalizePromptPart(part);
        return !key || !wanted.has(key);
    });
    const next = kept.map((part) => part.trim()).filter(Boolean).join(", ");
    return next ? `${next}, ` : "";
}

function removePromptTags(current = "", tags = []) {
    const raw = String(current || "");
    const sequenced = removePromptTagSequence(raw, tags);
    if (sequenced !== raw) return sequenced;
    return removePromptTagSet(raw, tags);
}

function getStoredCharacterParts(node) {
    const local = Array.isArray(node?._animaCharacterParts) ? node._animaCharacterParts : [];
    if (local.length) return local;
    const stored = Array.isArray(node?.properties?.[CHARACTER_PARTS_PROP])
        ? node.properties[CHARACTER_PARTS_PROP]
        : [];
    return stored;
}

function setStoredCharacterParts(node, parts = []) {
    const clean = splitPromptTagList(parts)
        .map((part) => String(part || "").trim())
        .filter(Boolean);
    if (!node) return clean;
    node._animaCharacterParts = clean;
    if (!node.properties || typeof node.properties !== "object") node.properties = {};
    node.properties[CHARACTER_PARTS_PROP] = clean;
    return clean;
}

function characterTriggerParts(artist, mode = "trigger") {
    const trigger = splitPromptTagList(artist?.trigger || artist?.tag || "");
    const tags = Array.isArray(artist?.tags)
        ? splitPromptTagList(artist.tags)
        : [];
    if (mode === "trigger-tags") return [...trigger, ...tags].filter(Boolean);
    return trigger;
}

function isSubjectCountTag(value = "") {
    return /^\d+\s*(?:girl|girls|boy|boys)$/i.test(
        String(value || "")
            .replace(/^@+/, "")
            .replace(/_/g, " ")
            .replace(/\s+/g, "")
            .trim()
    );
}

function subjectPromptParts(subject = "keep") {
    const raw = String(subject || "keep").trim().toLowerCase();
    if (!raw || raw === "keep") return [];
    return raw
        .split(",")
        .map((part) => part.replace(/\s+/g, "").trim())
        .filter((part) => isSubjectCountTag(part));
}

function removeSubjectTags(current = "", subject = "keep") {
    if (!subjectPromptParts(subject).length) return String(current || "");
    const kept = promptParts(current).filter((part) => !isSubjectCountTag(part));
    return joinPromptParts(kept);
}

function characterSelectionParts(artists = [], mode = "trigger", subject = "keep") {
    let parts = (Array.isArray(artists) ? artists : [artists])
        .flatMap((artist) => characterTriggerParts(artist, mode))
        .map((part) => String(part || "").trim())
        .filter(Boolean);

    const subjectParts = subjectPromptParts(subject);
    if (subjectParts.length) {
        parts = parts.filter((part) => !isSubjectCountTag(part));
        parts = [...subjectParts, ...parts];
    }

    return parts;
}

function uniquePromptParts(parts = []) {
    const seen = new Set();
    const result = [];
    for (const part of splitPromptTagList(parts)) {
        const key = normalizePromptPart(part);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(part);
    }
    return result;
}

function detectCharacterPartsInPrompt(current = "", knownCharacters = []) {
    const prompt = promptParts(current);
    if (!prompt.length || !Array.isArray(knownCharacters) || !knownCharacters.length) return [];

    const normalized = prompt.map((part) => normalizePromptPart(part));
    const promptSet = new Set(normalized);
    const matches = [];

    for (const item of knownCharacters) {
        if (sourceKindFromArtist(item) !== "character") continue;
        const triggerParts = uniquePromptParts(characterTriggerParts(item, "trigger"));
        if (!triggerParts.length) continue;

        const normalizedTrigger = triggerParts.map((part) => normalizePromptPart(part)).filter(Boolean);
        if (!normalizedTrigger.length || !normalizedTrigger.every((part) => promptSet.has(part))) continue;

        const firstIndex = normalized.findIndex((part) => part === normalizedTrigger[0]);
        const allParts = uniquePromptParts(characterSelectionParts([item], "trigger-tags", "keep"));
        const tagHits = allParts.reduce((count, part) => count + (promptSet.has(normalizePromptPart(part)) ? 1 : 0), 0);
        matches.push({
            firstIndex: firstIndex < 0 ? Number.MAX_SAFE_INTEGER : firstIndex,
            score: normalizedTrigger.length * 100 + tagHits,
            parts: allParts,
        });
    }

    matches.sort((a, b) => a.firstIndex - b.firstIndex || b.score - a.score);
    return uniquePromptParts(matches.flatMap((match) => match.parts));
}

export function applyStyle(node, artist, options = {}) {
    const w = getPromptWidget(node);
    if (!w) return { ok: false, error: "Prompt widget not found." };

    const tag = String(artist?.tag || "").trim();
    if (!tag) return { ok: false, error: "Selected item has no tag." };

    const kind = sourceKindFromArtist(artist);
    const rawReplaceParts = Array.isArray(options?.replaceParts) ? options.replaceParts : [];
    const storedCharacterParts = kind === "character" ? getStoredCharacterParts(node) : [];
    const replaceParts = kind === "character"
        ? (
            !rawReplaceParts.length || rawReplaceParts.some((part) => String(part || "").trim().startsWith("@"))
                ? storedCharacterParts
                : rawReplaceParts
        )
        : rawReplaceParts;
    const rawCurrent = String(w.value || "");
    const current = removeSubjectTags(removePromptTags(rawCurrent, replaceParts), options?.subject);

    if (kind === "character") {
        return applyCharacterGroup(node, [artist], options);
    }

    const styleAction = String(options?.styleAction || "");
    const newVal = styleAction
        ? applyStyleTokenAction(rawCurrent, tag, styleAction, options?.replaceIndex)
        : injectStyleTagGroup(current, [tag]);
    setPromptValue(node, w, newVal, tag, kind);
    return {
        ok: true,
        action: styleAction || "apply-style",
        kind,
        tag,
        prompt: newVal,
        inserted: getStyleTokensFromText(newVal),
    };
}

export function applyCharacterGroup(node, artists = [], options = {}) {
    const w = getPromptWidget(node);
    if (!w) return { ok: false, error: "Prompt widget not found." };

    const list = (Array.isArray(artists) ? artists : [artists])
        .filter((artist) => sourceKindFromArtist(artist) === "character");
    if (!list.length) return { ok: false, error: "No character tags selected." };

    const mode = options?.mode === "trigger-tags" ? "trigger-tags" : "trigger";
    const rawReplaceParts = Array.isArray(options?.replaceParts) ? options.replaceParts : [];
    const storedCharacterParts = getStoredCharacterParts(node);
    const detectedCharacterParts = detectCharacterPartsInPrompt(String(w.value || ""), options?.knownCharacters || []);
    const explicitReplaceParts = rawReplaceParts.some((part) => String(part || "").trim().startsWith("@"))
        ? []
        : rawReplaceParts;
    const replaceParts = uniquePromptParts([
        ...detectedCharacterParts,
        ...storedCharacterParts,
        ...explicitReplaceParts,
    ]);
    const current = removeSubjectTags(removePromptTags(String(w.value || ""), replaceParts), options?.subject);
    const parts = characterSelectionParts(list, mode, options?.subject);
    const appended = appendPromptTagsDetailed(current, parts);
    const newVal = appended.prompt;
    const inserted = setStoredCharacterParts(node, appended.inserted.length ? appended.inserted : parts);
    const keepTag = String(node?._currentTag || "");
    const keepKind = String(node?._currentTagKind || "style");
    setPromptValue(node, w, newVal, keepTag, keepTag ? keepKind : "");
    return {
        ok: true,
        action: list.length > 1
            ? (mode === "trigger-tags" ? "character-group-tags" : "character-group")
            : mode,
        kind: "character",
        tag: String(list[0]?.tag || ""),
        prompt: newVal,
        inserted,
    };
}

export function applyStyleGroup(node, artists = [], options = {}) {
    const w = getPromptWidget(node);
    if (!w) return { ok: false, error: "Prompt widget not found." };

    const tags = (Array.isArray(artists) ? artists : [])
        .filter((artist) => sourceKindFromArtist(artist) === "style")
        .map((artist) => String(artist?.tag || "").trim())
        .filter(Boolean);

    if (!tags.length) return { ok: false, error: "No artist tags selected." };

    const current = removePromptTags(String(w.value || ""), options?.replaceParts || []);
    const newVal = injectStyleTagGroup(current, tags);
    const primaryTag = tags[0];
    setPromptValue(node, w, newVal, primaryTag, "style");

    return {
        ok: true,
        action: tags.length > 1 ? "apply-style-group" : "apply-style",
        kind: "style",
        tag: primaryTag,
        prompt: newVal,
        inserted: tags.map(stylePromptToken).filter(Boolean),
    };
}

export function stripLeadingArtist(prompt = "") {
    return String(prompt || "").replace(/^\s*@[^,\n]+\s*,?\s*/i, "").trim();
}

export function buildFulletCopyText(post, mode = "both") {
    const artist = normalizeArtist(post?.artist || "");
    const promptOnly = stripLeadingArtist(post?.prompt || "");

    if (mode === "prompt") return promptOnly;
    if (mode === "artist") return artist.token;
    return composeArtistAndPrompt(artist.token, promptOnly);
}

export function applyTemplateStyle(node, post) {
    const w = getPromptWidget(node);
    if (!w) {
        return { ok: false, error: "Prompt widget not found in node." };
    }

    const template = String(w.value || "");
    const hasPromptToken = /\{\{\s*prompt\s*\}\}/i.test(template);
    const hasArtistToken = /\{\{\s*artist\s*\}\}/i.test(template);

    if (!hasPromptToken || !hasArtistToken) {
        return {
            ok: false,
            error: "Template must include both {{prompt}} and {{artist}}.",
        };
    }

    const artist = normalizeArtist(post?.artist || "");
    const rawPrompt = String(post?.prompt || "").trim();

    if (!artist.display || !rawPrompt) {
        return { ok: false, error: "Selected post is missing prompt or artist." };
    }

    const cleanedPrompt = stripLeadingArtist(rawPrompt);

    const rendered = template
        .replace(/\{\{\s*prompt\s*\}\}/gi, cleanedPrompt)
        .replace(/\{\{\s*artist\s*\}\}/gi, artist.token);

    setPromptValue(node, w, rendered, artist.tag, "style");

    return {
        ok: true,
        prompt: rendered,
        artist: artist.display,
    };
}

export function applyFulletSelection(node, post, mode = "both") {
    const w = getPromptWidget(node);
    if (!w) {
        return { ok: false, error: "Prompt widget not found in node." };
    }

    const artist = normalizeArtist(post?.artist || "");
    const rawPrompt = String(post?.prompt || "").trim();
    if (!artist.display || !rawPrompt) {
        return { ok: false, error: "Selected post is missing prompt or artist." };
    }

    const promptOnly = stripLeadingArtist(rawPrompt);
    const current = String(w.value || "");

    if (mode === "artist") {
        const structured = applyStructuredFields(current, {
            artistToken: artist.token,
            updateArtist: true,
            updatePrompt: false,
        });
        if (structured !== null) {
            setPromptValue(node, w, structured, artist.tag, "style");
            return { ok: true, mode, prompt: structured, artist: artist.display };
        }

        const next = injectTag(current, artist.tag);
        setPromptValue(node, w, next, artist.tag, "style");
        return { ok: true, mode, prompt: next, artist: artist.display };
    }

    if (mode === "prompt") {
        const hasPromptToken = /\{\{\s*prompt\s*\}\}/i.test(current);
        if (hasPromptToken) {
            const rendered = current.replace(/\{\{\s*prompt\s*\}\}/gi, promptOnly);
            const keepTag = String(node?._currentTag || "");
            const keepKind = String(node?._currentTagKind || "style");
            setPromptValue(node, w, rendered, keepTag, keepTag ? keepKind : "");
            return { ok: true, mode, prompt: rendered, artist: keepTag ? keepTag.replace(/_/g, " ") : "" };
        }

        const structured = applyStructuredFields(current, {
            promptText: promptOnly,
            updateArtist: false,
            updatePrompt: true,
        });
        if (structured !== null) {
            const keepTag = String(node?._currentTag || "");
            const keepKind = String(node?._currentTagKind || "style");
            setPromptValue(node, w, structured, keepTag, keepTag ? keepKind : "");
            return { ok: true, mode, prompt: structured, artist: keepTag ? keepTag.replace(/_/g, " ") : "" };
        }

        const preservedArtist = resolvePreservedArtist(current, String(node?._currentTag || ""));
        const next = composeArtistAndPrompt(preservedArtist.token, promptOnly);
        setPromptValue(node, w, next, preservedArtist.tag, "style");
        return {
            ok: true,
            mode,
            prompt: next,
            artist: preservedArtist.tag ? preservedArtist.tag.replace(/_/g, " ") : "",
        };
    }

    const hasPromptToken = /\{\{\s*prompt\s*\}\}/i.test(current);
    const hasArtistToken = /\{\{\s*artist\s*\}\}/i.test(current);

    if (hasPromptToken && hasArtistToken) {
        return applyTemplateStyle(node, post);
    }

    if (hasPromptToken || hasArtistToken) {
        const rendered = current
            .replace(/\{\{\s*prompt\s*\}\}/gi, promptOnly)
            .replace(/\{\{\s*artist\s*\}\}/gi, artist.token);
        const next = hasArtistToken ? rendered : injectTag(rendered, artist.tag);
        setPromptValue(node, w, next, artist.tag, "style");
        return { ok: true, mode: "both", prompt: next, artist: artist.display };
    }

    const structured = applyStructuredFields(current, {
        artistToken: artist.token,
        promptText: promptOnly,
        updateArtist: true,
        updatePrompt: true,
    });
    if (structured !== null) {
        setPromptValue(node, w, structured, artist.tag, "style");
        return { ok: true, mode: "both", prompt: structured, artist: artist.display };
    }

    const next = composeArtistAndPrompt(artist.token, promptOnly);
    setPromptValue(node, w, next, artist.tag, "style");
    return { ok: true, mode: "both", prompt: next, artist: artist.display };
}




