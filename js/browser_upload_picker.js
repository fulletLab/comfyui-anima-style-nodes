import { escapeHtml, normalizeTag } from "./browser_helpers.js";
import { Data } from "./data.js";
import { showToast } from "./toast.js";

const MAX_UPLOAD_ITEMS = 36;
const MAX_COLLAGE_ITEMS = 20;
const MIN_VALID_TIMESTAMP = Date.UTC(2024, 0, 1);

function loadBool(key, fallback = false) {
    try {
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        return raw === "true";
    } catch {
        return fallback;
    }
}

function saveBool(key, value) {
    try {
        localStorage.setItem(key, value ? "true" : "false");
    } catch { }
}

function normalizeTimestamp(value) {
    let ts = 0;

    if (typeof value === "number" && Number.isFinite(value) && value > 1000000000) {
        ts = value < 1000000000000 ? value * 1000 : value;
    } else {
        const raw = String(value ?? "").trim();
        if (!raw) return 0;

        const asNumber = Number(raw);
        if (Number.isFinite(asNumber) && asNumber > 1000000000) {
            ts = asNumber < 1000000000000 ? asNumber * 1000 : asNumber;
        } else {
            const parsed = Date.parse(raw);
            ts = Number.isFinite(parsed) ? parsed : 0;
        }
    }

    const maxAllowed = Date.now() + 86400000;
    if (!ts || ts < MIN_VALID_TIMESTAMP || ts > maxAllowed) return 0;
    return ts;
}

function extractArtistTag(text) {
    const value = String(text || "").trim();
    if (!value) return "";
    const match = value.match(/@([^\n,]+?)(?=(?:,|\n|$))/);
    return match ? match[1].trim() : "";
}

function stripLeadingArtist(text) {
    const value = String(text || "").trim();
    if (!value) return "";
    return value.replace(/^@([^\n,]+?)\s*(?:,|\n)\s*/u, "").trim();
}

function isPromptGraph(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
    return Object.values(candidate).some((value) => {
        return value
            && typeof value === "object"
            && !Array.isArray(value)
            && (typeof value.class_type === "string" || typeof value.inputs === "object");
    });
}

function findPromptGraph(entry) {
    const candidates = [
        entry?.prompt,
        entry?.workflow,
        entry?.graph,
        entry?.extra_data?.prompt,
        entry?.extra_data?.workflow,
        entry?.prompt?.prompt,
        entry?.prompt?.workflow,
    ];

    for (const candidate of candidates) {
        if (isPromptGraph(candidate)) return candidate;

        if (Array.isArray(candidate)) {
            for (const part of candidate) {
                if (isPromptGraph(part)) return part;
                if (part && typeof part === "object") {
                    if (isPromptGraph(part.prompt)) return part.prompt;
                    if (isPromptGraph(part.workflow)) return part.workflow;
                    if (isPromptGraph(part.extra_data?.prompt)) return part.extra_data.prompt;
                }
            }
        }

        if (candidate && typeof candidate === "object") {
            for (const nested of Object.values(candidate)) {
                if (isPromptGraph(nested)) return nested;
            }
        }
    }

    return null;
}

function collectImagesFromSource(source, bucket) {
    if (!source || typeof source !== "object") return;

    if (Array.isArray(source)) {
        for (const item of source) collectImagesFromSource(item, bucket);
        return;
    }

    if (Array.isArray(source.images)) {
        for (const image of source.images) {
            if (!image || typeof image !== "object") continue;
            const filename = String(image.filename || "").trim();
            if (!filename) continue;
            bucket.push({
                filename,
                subfolder: String(image.subfolder || "").trim(),
                type: String(image.type || "output").trim() || "output",
            });
        }
    }

    for (const nested of Object.values(source)) {
        if (nested && typeof nested === "object") collectImagesFromSource(nested, bucket);
    }
}

function extractImages(entry) {
    const bucket = [];
    const sources = [entry?.outputs, entry?.output];

    if (Array.isArray(entry?.prompt)) {
        for (const part of entry.prompt) {
            if (part && typeof part === "object") {
                if (part.outputs) sources.push(part.outputs);
                if (part.output) sources.push(part.output);
            }
        }
    }

    for (const source of sources) collectImagesFromSource(source, bucket);

    const seen = new Set();
    return bucket.filter((image) => {
        const key = `${image.type}|${image.subfolder}|${image.filename}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getNodeId(value) {
    if (Array.isArray(value) && value.length > 0) return String(value[0] ?? "").trim();
    if (typeof value === "string" && value.trim()) return value.trim();
    return "";
}

function traceTextFromNode(graph, startRef, visited = new Set()) {
    const nodeId = getNodeId(startRef);
    if (!nodeId || visited.has(nodeId)) return "";
    visited.add(nodeId);

    const node = graph?.[nodeId];
    if (!node || typeof node !== "object") return "";
    const inputs = node.inputs && typeof node.inputs === "object" ? node.inputs : {};

    if (typeof inputs.text === "string" && inputs.text.trim()) return inputs.text.trim();
    if (typeof inputs.prompt === "string" && inputs.prompt.trim()) return inputs.prompt.trim();
    if (typeof inputs.string === "string" && inputs.string.trim()) return inputs.string.trim();

    const preferredLinks = [inputs.positive, inputs.negative, inputs.conditioning, inputs.text, inputs.clip, inputs.prompt, inputs.string];
    for (const link of preferredLinks) {
        const nested = traceTextFromNode(graph, link, visited);
        if (nested) return nested;
    }

    for (const value of Object.values(inputs)) {
        const nested = traceTextFromNode(graph, value, visited);
        if (nested) return nested;
    }

    return "";
}

function findFirstNodeByClass(graph, matcher) {
    if (!graph || typeof graph !== "object") return null;
    for (const [id, node] of Object.entries(graph)) {
        const classType = String(node?.class_type || "");
        if (matcher.test(classType)) return { id, node };
    }
    return null;
}

function collectTextCandidates(graph) {
    const positives = [];
    const negatives = [];
    const artistHints = [];

    if (!graph || typeof graph !== "object") return { positives, negatives, artistHints };

    for (const [id, node] of Object.entries(graph)) {
        const classType = String(node?.class_type || "").toLowerCase();
        const inputs = node?.inputs && typeof node.inputs === "object" ? node.inputs : {};
        for (const [key, rawValue] of Object.entries(inputs)) {
            if (typeof rawValue !== "string") continue;
            const value = rawValue.trim();
            if (!value) continue;

            const keyLower = String(key || "").toLowerCase();
            const scoreBase = value.length;
            if (/@/.test(value)) {
                artistHints.push({ value, score: scoreBase + (keyLower.includes("tag") ? 2000 : 0) + (classType.includes("anima") ? 1500 : 0) + Number(id || 0) });
            }

            if (/negative|neg/.test(keyLower) || classType.includes("negative")) {
                negatives.push({ value, score: scoreBase + (keyLower.includes("text") ? 500 : 0) });
                continue;
            }

            if (/^(text|prompt|positive|positive_prompt|string|style_prompt)$/i.test(keyLower) || classType.includes("cliptextencode") || classType.includes("anima")) {
                positives.push({ value, score: scoreBase + (/@/.test(value) ? 1000 : 0) + (/prompt/i.test(keyLower) ? 400 : 0) + (classType.includes("cliptextencode") ? 500 : 0) + (classType.includes("anima") ? 700 : 0) });
            }
        }
    }

    positives.sort((a, b) => b.score - a.score);
    negatives.sort((a, b) => b.score - a.score);
    artistHints.sort((a, b) => b.score - a.score);
    return { positives, negatives, artistHints };
}

function buildComfyMetadata(graph, entry, artist, fullPrompt, negativePrompt) {
    const metadata = {
        artist: artist || "",
        prompt: fullPrompt || "",
        negativePrompt: negativePrompt || "",
        historyId: String(entry?._historyId || ""),
        sourceType: String(entry?._historyIndex ?? ""),
    };

    const kSampler = findFirstNodeByClass(graph, /ksampler/i);
    if (kSampler?.node?.inputs) {
        const inputs = kSampler.node.inputs;
        if (inputs.steps != null) metadata.steps = inputs.steps;
        if (inputs.cfg != null) metadata.cfg = inputs.cfg;
        if (inputs.seed != null) metadata.seed = inputs.seed;
        if (inputs.sampler_name) metadata.sampler = inputs.sampler_name;
        if (inputs.scheduler) metadata.scheduler = inputs.scheduler;
    }

    const latent = findFirstNodeByClass(graph, /emptylatentimage/i);
    if (latent?.node?.inputs?.width && latent?.node?.inputs?.height) {
        metadata.size = `${latent.node.inputs.width}x${latent.node.inputs.height}`;
    }

    const checkpoint = findFirstNodeByClass(graph, /checkpointloader/i);
    if (checkpoint?.node?.inputs?.ckpt_name) {
        metadata.checkpoint = checkpoint.node.inputs.ckpt_name;
    }

    return metadata;
}

function extractPromptMeta(promptGraph, entry) {
    const graph = promptGraph && typeof promptGraph === "object" ? promptGraph : null;
    const textCandidates = collectTextCandidates(graph);
    const kSampler = findFirstNodeByClass(graph, /ksampler/i);

    let positivePrompt = "";
    let negativePrompt = "";

    if (kSampler?.node?.inputs) {
        positivePrompt = traceTextFromNode(graph, kSampler.node.inputs.positive);
        negativePrompt = traceTextFromNode(graph, kSampler.node.inputs.negative);
    }

    if (!positivePrompt) {
        positivePrompt = textCandidates.positives[0]?.value || "";
    }
    if (!negativePrompt) {
        negativePrompt = textCandidates.negatives[0]?.value || "";
    }

    const rawPrompt = typeof entry?.prompt_text === "string"
        ? entry.prompt_text.trim()
        : typeof entry?.promptText === "string"
            ? entry.promptText.trim()
            : typeof entry?.text === "string"
                ? entry.text.trim()
                : "";

    if (!positivePrompt && rawPrompt) {
        positivePrompt = rawPrompt;
    }

    const artistFromPrompt = extractArtistTag(positivePrompt);
    const artistFromHint = extractArtistTag(textCandidates.artistHints[0]?.value || "");
    const artist = artistFromPrompt || artistFromHint;

    const promptBody = stripLeadingArtist(positivePrompt);
    const fallbackBody = stripLeadingArtist(textCandidates.positives.find((candidate) => !/^@[^,\n]+$/u.test(candidate.value.trim()))?.value || "");
    let fullPrompt = positivePrompt;

    if (artist) {
        const tagPrompt = `@${artist}`;
        if (!fullPrompt || /^@[^,\n]+$/u.test(fullPrompt.trim())) {
            const body = promptBody || fallbackBody;
            fullPrompt = body ? `${tagPrompt}, ${body}` : tagPrompt;
        } else if (!/@/.test(fullPrompt)) {
            const body = stripLeadingArtist(fullPrompt);
            fullPrompt = body ? `${tagPrompt}, ${body}` : tagPrompt;
        }
    }

    const promptPreview = stripLeadingArtist(fullPrompt) || stripLeadingArtist(positivePrompt) || fallbackBody || fullPrompt;
    const isAnima = !!artist && !!(fullPrompt || promptPreview);
    const metadata = buildComfyMetadata(graph, entry, artist, fullPrompt, negativePrompt);

    return {
        isAnima,
        artist,
        prompt: fullPrompt,
        promptPreview,
        negativePrompt,
        metadata,
    };
}

function buildViewUrl(image) {
    const params = new URLSearchParams();
    params.set("filename", String(image.filename || ""));
    params.set("type", String(image.type || "output"));
    if (image.subfolder) params.set("subfolder", String(image.subfolder));
    return `/view?${params.toString()}`;
}

function formatTimeLabel(timestamp) {
    if (!timestamp) return "Recent";

    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
    if (diff < 86400000) return `${Math.max(1, Math.round(diff / 3600000))}h ago`;
    if (diff < 86400000 * 365) return `${Math.max(1, Math.round(diff / 86400000))}d ago`;
    return "Recent";
}

function normalizeHistoryEntries(payload) {
    if (Array.isArray(payload)) {
        return payload.map((entry, index) => ({
            ...(entry || {}),
            _historyId: String(entry?.id || entry?.prompt_id || index),
            _historyIndex: index,
        }));
    }

    if (!payload || typeof payload !== "object") return [];

    return Object.entries(payload).map(([id, entry], index) => ({
        ...(entry || {}),
        _historyId: String(id),
        _historyIndex: index,
    }));
}

export function buildUploadItems(historyPayload, { limit = MAX_UPLOAD_ITEMS } = {}) {
    const entries = normalizeHistoryEntries(historyPayload);
    const items = [];

    entries.forEach((entry, index) => {
        const promptGraph = findPromptGraph(entry);
        const meta = extractPromptMeta(promptGraph, entry);
        if (!meta.isAnima) return;

        const images = extractImages(entry);
        if (!images.length) return;

        const timestamp = [
            entry?.status?.completed_at,
            entry?.completed_at,
            entry?.created_at,
            entry?.time,
        ].map(normalizeTimestamp).find((value) => value > 0) || 0;

        images.forEach((image, imageIndex) => {
            items.push({
                id: `${entry._historyId}:${image.type}:${image.subfolder}:${image.filename}:${imageIndex}`,
                historyId: entry._historyId,
                artist: meta.artist,
                prompt: meta.prompt,
                promptPreview: meta.promptPreview,
                negativePrompt: meta.negativePrompt,
                metadata: {
                    ...meta.metadata,
                    filename: image.filename,
                    subfolder: image.subfolder,
                    fileType: image.type,
                },
                filename: image.filename,
                subfolder: image.subfolder,
                type: image.type,
                viewUrl: buildViewUrl(image),
                timestamp,
                sortIndex: index,
                imageIndex,
            });
        });
    });

    const seen = new Set();
    return items
        .sort((a, b) => {
            if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
            if (a.sortIndex !== b.sortIndex) return b.sortIndex - a.sortIndex;
            return a.imageIndex - b.imageIndex;
        })
        .filter((item) => {
            const key = `${item.type}|${item.subfolder}|${item.filename}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, Math.max(0, Number(limit) || MAX_UPLOAD_ITEMS));
}

function buildArtistLookup(artists = []) {
    const map = new Map();
    artists.forEach((artist) => {
        const key = normalizeTag(artist?.tag || "");
        if (key) map.set(key, artist);
    });
    return map;
}

function describeStyleStats(artist) {
    const works = Number(artist?.works || 0);
    const uniqueness = Number(artist?.uniqueness_score || 0);

    const footprint = works >= 3000
        ? "large reference footprint"
        : works >= 1000
            ? "solid reference footprint"
            : works > 0
                ? "niche reference footprint"
                : "unknown reference footprint";

    const signature = uniqueness >= 10
        ? "very distinct tag signal"
        : uniqueness >= 5
            ? "clear tag signal"
            : uniqueness > 0
                ? "subtle tag signal"
                : "unscored tag signal";

    return { footprint, signature, works, uniqueness };
}

function buildStyleResearch(items = [], artistLookup = new Map()) {
    const seen = new Set();
    const artists = [];

    items.forEach((item, index) => {
        const artistTag = String(item?.artist || "").trim();
        const key = normalizeTag(artistTag);
        const source = artistLookup.get(key) || {};
        const stats = describeStyleStats(source);

        artists.push({
            imageIndex: index + 1,
            artist: artistTag,
            datasetId: String(source?.id || ""),
            works: stats.works,
            uniquenessScore: stats.uniqueness,
            footprint: stats.footprint,
            signature: stats.signature,
            filename: String(item?.filename || ""),
            promptPreview: String(item?.promptPreview || item?.prompt || "").slice(0, 320),
            styleLabel: artistTag ? `@${artistTag}` : `Image ${index + 1}`,
            styleNotes: `${stats.footprint}; ${stats.signature}.`,
            comparisonNotes: "",
        });
        if (key) seen.add(key);
    });

    const names = Array.from(new Set(artists.map((item) => item.artist).filter(Boolean)));
    const differentiators = artists.map((item) => {
        const statsLabel = item.works
            ? `${item.works} works, uniqueness ${item.uniquenessScore || 0}`
            : "local output only";
        return `@${item.artist}: ${item.footprint}, ${item.signature} (${statsLabel})`;
    });

    return {
        type: "anima_style_collage",
        version: 1,
        generatedAt: new Date().toISOString(),
        styleCount: seen.size || names.length,
        imageCount: items.length,
        title: names.length > 1
            ? `Comparing ${names.map((name) => `@${name}`).join(", ")}`
            : `Style study for @${names[0] || "unknown"}`,
        summary: names.length > 1
            ? `Anima style collage comparing ${names.map((name) => `@${name}`).join(", ")}.`
            : `Anima style post for @${names[0] || "unknown"}.`,
        conclusion: names.length > 1
            ? "Use the per-image notes to compare where each style feels more attached to the scene, background, lighting, and character treatment."
            : "Use the notes to judge how this style behaves across scene, background, lighting, and character treatment.",
        basis: "Generated from local ComfyUI history, @artist tags, and the bundled Anima style dataset metrics.",
        artists,
        differentiators,
    };
}

function buildCollagePrompt(items = [], research = {}) {
    const first = items[0] || {};
    const names = Array.from(new Set(items.map((item) => String(item.artist || "").trim()).filter(Boolean)));
    const lead = names[0] ? `@${names[0]}` : String(first.prompt || first.promptPreview || "Anima style collage").trim();
    const promptBody = stripLeadingArtist(first.promptPreview || first.prompt || "");
    const comparison = names.length > 1 ? `style collage study comparing ${names.map((name) => `@${name}`).join(", ")}` : "style study";
    return `${lead}, ${comparison}${promptBody ? `, base prompt: ${promptBody}` : ""}`.slice(0, 5000);
}

function buildCollageDescription(research = {}) {
    const lines = Array.isArray(research.differentiators) ? research.differentiators : [];
    if (!lines.length) return "";
    return [
        research.summary,
        "Mini research notes:",
        ...lines.map((line) => `- ${line}`),
    ].filter(Boolean).join("\n").slice(0, 2000);
}

function buildCollageTags(items = []) {
    const artistTags = Array.from(new Set(items
        .map((item) => normalizeTag(item?.artist || "").replace(/_/g, "-").replace(/[^a-z0-9-]/g, ""))
        .filter(Boolean)
        .map((tag) => `style-${tag}`)));

    return ["anima", "style-collage", "style-study", ...artistTags].slice(0, 16);
}

function buildImagesData(items = [], research = {}, preserveMetadata = true) {
    const byArtist = new Map((research.artists || []).map((item) => [String(item.artist || ""), item]));
    return items.map((item, index) => {
        const styleStudy = byArtist.get(String(item.artist || "")) || {};
        const statsLabel = styleStudy.works
            ? `${styleStudy.works} works, uniqueness ${styleStudy.uniquenessScore || 0}`
            : "local output only";
        const styleLabel = styleStudy.styleLabel || (item.artist ? `@${item.artist}` : `Image ${index + 1}`);
        const styleNotes = styleStudy.styleNotes || `${styleStudy.footprint || "local reference footprint"}; ${styleStudy.signature || "local style signal"}.`;
        const comparisonNotes = styleStudy.comparisonNotes || `${styleLabel}: ${styleNotes} (${statsLabel})`;
        return {
            prompt: String(item.prompt || item.promptPreview || "").trim(),
            negativePrompt: String(item.negativePrompt || "").trim(),
            styleLabel,
            styleNotes,
            comparisonNotes,
            settings: preserveMetadata
                ? {
                    ...(item.metadata || {}),
                    styleStudy: {
                        imageIndex: index + 1,
                        artist: item.artist || "",
                        works: styleStudy.works || 0,
                        uniquenessScore: styleStudy.uniquenessScore || 0,
                        footprint: styleStudy.footprint || "",
                        signature: styleStudy.signature || "",
                    },
                }
                : {},
        };
    });
}

function renderCard(item, { onUpload, isSelected, onToggleSelection }) {
    const card = document.createElement("div");
    card.className = `anima-upload-card ${isSelected ? "selected" : ""}`;
    card.innerHTML = `
        <div class="anima-upload-thumb" data-init="${escapeHtml((item.artist[0] || "?").toUpperCase())}">
            <img loading="lazy" src="${escapeHtml(item.viewUrl)}" alt="${escapeHtml(item.artist)}" onerror="this.style.display='none';this.parentElement.classList.add('no-img')" />
            <span class="anima-upload-badge">@${escapeHtml(item.artist)}</span>
            <button class="anima-control anima-upload-select" type="button" aria-pressed="${isSelected ? "true" : "false"}" title="Select for collage">
                ${isSelected ? "Selected" : "Select"}
            </button>
        </div>
        <div class="anima-upload-meta">
            <div class="anima-upload-row">
                <span class="anima-upload-artist">@${escapeHtml(item.artist)}</span>
                <span class="anima-upload-time">${escapeHtml(formatTimeLabel(item.timestamp))}</span>
            </div>
            <p class="anima-upload-prompt">${escapeHtml(item.promptPreview || item.prompt || "Generated image")}</p>
            <button class="anima-control anima-control-full anima-upload-action">Publish single image</button>
        </div>
    `;

    const thumb = card.querySelector(".anima-upload-thumb");
    const actionBtn = card.querySelector(".anima-upload-action");
    const selectBtn = card.querySelector(".anima-upload-select");
    selectBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        onToggleSelection?.(item);
    });
    card.addEventListener("dblclick", () => onToggleSelection?.(item));
    actionBtn?.addEventListener("click", async (event) => {
        event.stopPropagation();
        await onUpload([item], thumb || card, actionBtn);
    });
    return card;
}

export function createUploadPicker({
    root,
    api,
    localHeaders,
    ensureLocalToken,
    refreshAuthStatus,
}) {
    const modal = root.querySelector("#anima-upload-modal");
    const panel = root.querySelector("#anima-upload-panel");
    const closeBtn = root.querySelector("#anima-upload-close");
    const refreshBtn = root.querySelector("#anima-upload-refresh");
    const grid = root.querySelector("#anima-upload-grid");
    const nsfwToggle = root.querySelector("#anima-upload-nsfw");
    const preserveToggle = root.querySelector("#anima-upload-preserve");
    const selectionCountEl = root.querySelector("#anima-upload-selection");
    const uploadSelectedBtn = root.querySelector("#anima-upload-selected");
    const clearSelectionBtn = root.querySelector("#anima-upload-clear");

    const state = {
        items: [],
        loading: false,
        uploadingId: "",
        selectedIds: new Set(),
        artistLookup: new Map(),
        manualNsfw: loadBool("anima_upload_nsfw", false),
        preserveMetadata: loadBool("anima_upload_preserve_metadata", true),
    };

    if (nsfwToggle) nsfwToggle.checked = state.manualNsfw;
    if (preserveToggle) preserveToggle.checked = state.preserveMetadata;

    nsfwToggle?.addEventListener("change", (event) => {
        state.manualNsfw = !!event.target.checked;
        saveBool("anima_upload_nsfw", state.manualNsfw);
    });

    preserveToggle?.addEventListener("change", (event) => {
        state.preserveMetadata = !!event.target.checked;
        saveBool("anima_upload_preserve_metadata", state.preserveMetadata);
    });

    function isOpen() {
        return !!modal && !modal.classList.contains("hidden");
    }

    function close() {
        modal?.classList.add("hidden");
    }

    function getSelectedItems() {
        return state.items.filter((item) => state.selectedIds.has(item.id));
    }

    function syncSelectionControls() {
        const count = state.selectedIds.size;
        if (selectionCountEl) {
            selectionCountEl.textContent = count === 1 ? "1 selected" : `${count} selected`;
        }
        if (uploadSelectedBtn) {
            uploadSelectedBtn.disabled = count === 0 || state.loading || !!state.uploadingId;
            uploadSelectedBtn.textContent = count > 1 ? "Publish Collage" : "Publish Selected";
        }
        if (clearSelectionBtn) {
            clearSelectionBtn.disabled = count === 0 || !!state.uploadingId;
        }
    }

    function toggleSelection(item) {
        if (!item?.id || state.uploadingId) return;
        if (state.selectedIds.has(item.id)) {
            state.selectedIds.delete(item.id);
        } else {
            if (state.selectedIds.size >= MAX_COLLAGE_ITEMS) {
                showToast(`Max ${MAX_COLLAGE_ITEMS} images per collage`, "error", 1800);
                return;
            }
            state.selectedIds.add(item.id);
        }
        renderItems();
    }

    function clearSelection() {
        state.selectedIds.clear();
        renderItems();
    }

    function setLoading(message = "Loading recent generations...") {
        if (!grid) return;
        grid.innerHTML = `
            <div class="anima-upload-empty anima-upload-empty-loading">
                <div class="anima-spinner"></div>
                <span>${escapeHtml(message)}</span>
            </div>
        `;
        syncSelectionControls();
    }

    function setEmpty(message) {
        if (!grid) return;
        grid.innerHTML = `
            <div class="anima-upload-empty">
                <strong>No recent Anima generations found.</strong>
                <span>${escapeHtml(message)}</span>
            </div>
        `;
        syncSelectionControls();
    }

    function renderItems() {
        if (!grid) return;
        if (!state.items.length) {
            setEmpty("Generate an image with an @artist in the prompt, then come back here to publish it.");
            return;
        }

        grid.innerHTML = "";
        const frag = document.createDocumentFragment();
        state.items.forEach((item) => {
            frag.appendChild(renderCard(item, {
                onUpload: uploadItems,
                isSelected: state.selectedIds.has(item.id),
                onToggleSelection: toggleSelection,
            }));
        });
        grid.appendChild(frag);
        syncSelectionControls();
    }

    async function loadHistory() {
        if (state.loading) return;
        state.loading = true;
        setLoading();

        try {
            let response = await api.fetchApi("/history?max_items=80");
            if (!response.ok) {
                response = await api.fetchApi("/history");
            }

            if (!response.ok) {
                throw new Error(`History request failed (${response.status})`);
            }

            const payload = await response.json().catch(() => ({}));
            state.items = buildUploadItems(payload);
            const availableIds = new Set(state.items.map((item) => item.id));
            state.selectedIds = new Set([...state.selectedIds].filter((id) => availableIds.has(id)));
            const artists = await Data.all().catch(() => []);
            state.artistLookup = buildArtistLookup(Array.isArray(artists) ? artists : []);
            renderItems();
        } catch (error) {
            setEmpty(error?.message || "Could not load local generation history.");
        } finally {
            state.loading = false;
            syncSelectionControls();
        }
    }

    async function uploadItems(items, anchorEl, buttonEl) {
        const itemsToUpload = Array.isArray(items) ? items.filter(Boolean) : [];
        if (!itemsToUpload.length || state.uploadingId) return;
        if (itemsToUpload.length > MAX_COLLAGE_ITEMS) {
            showToast(`Max ${MAX_COLLAGE_ITEMS} images per collage`, "error", 1800, { anchor: anchorEl });
            return;
        }
        state.uploadingId = itemsToUpload.length === 1 ? itemsToUpload[0].id : "collage";
        syncSelectionControls();

        const isCollage = itemsToUpload.length > 1;
        const prevLabel = buttonEl?.textContent || (isCollage ? "Publish Collage" : "Publish single image");
        if (buttonEl) {
            buttonEl.textContent = isCollage ? "Publishing collage..." : "Uploading...";
            buttonEl.disabled = true;
        }

        try {
            const ok = await ensureLocalToken();
            if (!ok) {
                throw new Error("Local security token not available. Reopen the browser and try again.");
            }

            const research = buildStyleResearch(itemsToUpload, state.artistLookup);
            const prompt = isCollage
                ? buildCollagePrompt(itemsToUpload, research)
                : String(itemsToUpload[0].prompt || itemsToUpload[0].promptPreview || "").trim();
            const negativePrompt = String(itemsToUpload[0].negativePrompt || "").trim();
            const imagesData = buildImagesData(itemsToUpload, research, state.preserveMetadata);
            const form = new FormData();

            for (const item of itemsToUpload) {
                const viewResponse = await api.fetchApi(item.viewUrl);
                if (!viewResponse.ok) {
                    throw new Error(`Could not open local image (${viewResponse.status})`);
                }
                const blob = await viewResponse.blob();
                form.append("file", blob, item.filename || "generation.png");
            }

            form.append("prompt", prompt);
            form.append("negativePrompt", negativePrompt);
            form.append("model", "anima");
            form.append("category", "anime");
            form.append("manualNsfw", state.manualNsfw ? "true" : "false");
            form.append("preserveMetadata", state.preserveMetadata ? "true" : "false");
            form.append("imagesData", JSON.stringify(imagesData));

            if (isCollage) {
                form.append("description", buildCollageDescription(research));
                form.append("tags", JSON.stringify(buildCollageTags(itemsToUpload)));
                form.append("styleResearch", JSON.stringify(research));
            } else if (state.preserveMetadata && itemsToUpload[0].metadata && Object.keys(itemsToUpload[0].metadata).length) {
                form.append("settings", JSON.stringify(itemsToUpload[0].metadata));
            }

            const response = await api.fetchApi("/anima/fullet_upload", {
                method: "POST",
                headers: localHeaders(),
                body: form,
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || data?.ok === false) {
                if (response.status === 401 || response.status === 403) {
                    await refreshAuthStatus({ syncPending: false });
                }
                throw new Error(data?.error || `Upload failed (${response.status})`);
            }

            showToast(isCollage ? "Collage published to Fullet" : "Uploaded to Fullet", "success", 1800, { anchor: anchorEl });
            state.selectedIds.clear();
            close();
            await refreshAuthStatus({ syncPending: false });

            if (data?.postUrl) {
                window.open(data.postUrl, "_blank", "noopener");
            }
        } catch (error) {
            showToast(error?.message || "Upload failed", "error", 2200, { anchor: anchorEl });
        } finally {
            state.uploadingId = "";
            if (buttonEl) {
                buttonEl.textContent = prevLabel;
                buttonEl.disabled = false;
            }
            syncSelectionControls();
        }
    }

    async function open() {
        if (!modal) return;
        modal.classList.remove("hidden");
        await loadHistory();
    }

    closeBtn?.addEventListener("click", close);
    refreshBtn?.addEventListener("click", async () => {
        await loadHistory();
    });
    uploadSelectedBtn?.addEventListener("click", async () => {
        const selected = getSelectedItems();
        await uploadItems(selected, uploadSelectedBtn, uploadSelectedBtn);
    });
    clearSelectionBtn?.addEventListener("click", clearSelection);
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    panel?.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    return {
        open,
        close,
        isOpen,
        refresh: loadHistory,
    };
}
