import { buildUploadItems } from "./browser_upload_picker.js";
import { buildStyleList } from "./browser_renderers.js";

const GENERATED_HISTORY_MAX_ITEMS = 1000;
const GENERATED_OUTPUT_MAX_FILES = 5000;

export function normalizeGeneratedTag(value = "") {
    return String(value || "")
        .trim()
        .replace(/^@+/, "")
        .replace(/\\([()])/g, "$1")
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_()]+/gi, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
}

export function decorateGeneratedArtists(artists = [], previews = []) {
    const byArtist = new Map();
    previews.forEach((item) => {
        const key = normalizeGeneratedTag(item?.artist || item?.tag);
        if (key) byArtist.set(key, item);
    });

    return artists.map((artist) => {
        const key = normalizeGeneratedTag(artist?.tag);
        const preview = byArtist.get(key) || null;
        return {
            ...artist,
            generatedPreview: preview,
            generatedImageUrl: preview?.viewUrl || "",
            generatedAt: preview?.timestamp || 0,
        };
    });
}

export async function loadGeneratedPreviews(api) {
    try {
        const response = await api.fetchApi("/anima/generated_previews");
        const data = await response.json().catch(() => ({}));
        return Array.isArray(data?.items) ? data.items : [];
    } catch {
        return [];
    }
}

export function isGeneratedGalleryEnabled() {
    try {
        return localStorage.getItem("anima_generated_gallery_enabled") === "true";
    } catch {
        return false;
    }
}

export function setGeneratedGalleryEnabled(value) {
    try {
        localStorage.setItem("anima_generated_gallery_enabled", value ? "true" : "false");
        localStorage.setItem("anima_generated_gallery_prompted", "true");
    } catch { }
}

function timestampForFilename() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readResponseBlob(response, onProgress = null) {
    const total = Number(response.headers.get("Content-Length") || 0);
    if (!response.body || typeof response.body.getReader !== "function") {
        const blob = await response.blob();
        onProgress?.(1);
        return blob;
    }
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength || 0;
        onProgress?.(total ? Math.min(.98, received / total) : .35);
    }
    onProgress?.(1);
    return new Blob(chunks);
}

export async function exportGeneratedGallery(api, { includeImages = false, onProgress = null } = {}) {
    const filename = includeImages
        ? `anima-generated-gallery-${timestampForFilename()}.zip`
        : `anima-generated-gallery-${timestampForFilename()}.json`;
    let fileHandle = null;
    if (typeof window.showSaveFilePicker === "function") {
        fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
                description: includeImages ? "Anima Generated Gallery ZIP" : "Anima Generated Gallery JSON",
                accept: includeImages ? { "application/zip": [".zip"] } : { "application/json": [".json"] },
            }],
        });
    }
    onProgress?.(.05);
    const response = await api.fetchApi(`/anima/generated_previews/export?include_images=${includeImages ? 1 : 0}`);
    if (!response.ok) {
        throw new Error(`Generated gallery export failed (${response.status})`);
    }
    const blob = await readResponseBlob(response, (value) => onProgress?.(.05 + value * .85));
    if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        onProgress?.(1);
        return { saved: true, filename };
    }
    downloadBlob(blob, filename);
    onProgress?.(1);
    return { saved: false, filename };
}

export async function importGeneratedGallery(api, headers = {}, file) {
    if (!file) return [];
    let response = null;
    if (String(file.name || "").toLowerCase().endsWith(".json")) {
        const payload = JSON.parse(await file.text());
        response = await api.fetchApi("/anima/generated_previews/import", {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    } else {
        const form = new FormData();
        form.append("file", file, file.name || "gallery.zip");
        response = await api.fetchApi("/anima/generated_previews/import", {
            method: "POST",
            headers: headers || {},
            body: form,
        });
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.error || `Generated gallery import failed (${response.status})`);
    }
    return Array.isArray(data?.items) ? data.items : [];
}

export async function scanGeneratedHistory(api, headers = {}, { scanOutput = true } = {}) {
    let response = await api.fetchApi(`/history?max_items=${GENERATED_HISTORY_MAX_ITEMS}`);
    if (!response.ok) {
        response = await api.fetchApi("/history");
    }
    if (!response.ok) {
        throw new Error(`History request failed (${response.status})`);
    }

    const payload = await response.json().catch(() => ({}));
    const items = buildUploadItems(payload, { limit: GENERATED_HISTORY_MAX_ITEMS });
    let historyResult = null;
    if (!items.length) {
        const existing = await loadGeneratedPreviews(api);
        historyResult = { items: existing, scanned: 0, updated: false };
    } else {
        const update = await api.fetchApi("/anima/generated_previews", {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ items }),
        });
        if (!update.ok) {
            throw new Error(`Generated preview update failed (${update.status})`);
        }
        const data = await update.json().catch(() => ({}));
        historyResult = {
            items: Array.isArray(data?.items) ? data.items : items,
            scanned: items.length,
            updated: true,
        };
    }

    if (!scanOutput) return historyResult;

    const outputScan = await api.fetchApi("/anima/generated_previews/scan_output", {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ maxFiles: GENERATED_OUTPUT_MAX_FILES }),
    });
    if (!outputScan.ok) {
        return historyResult;
    }
    const outputData = await outputScan.json().catch(() => ({}));
    const outputItems = Array.isArray(outputData?.items) ? outputData.items : [];
    if (!outputItems.length) return historyResult;

    return {
        items: outputItems,
        scanned: historyResult.scanned,
        outputScanned: Number(outputData?.scanned || 0),
        outputMatched: Number(outputData?.matched || 0),
        updated: historyResult.updated || Number(outputData?.matched || 0) > 0,
    };
}

export async function removeGeneratedPreview(api, headers = {}, artist = "") {
    const response = await api.fetchApi("/anima/generated_previews/remove", {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ artist }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.error || `Generated preview remove failed (${response.status})`);
    }
    return Array.isArray(data?.items) ? data.items : [];
}

export function buildGeneratedList(artists = [], previews = [], { sort = "works", filter = "" } = {}) {
    const decorated = decorateGeneratedArtists(artists, previews);
    return buildStyleList(decorated, { sort, filter });
}
