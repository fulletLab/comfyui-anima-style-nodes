import { app } from "../../scripts/app.js";
import { injectCSS } from "./styles.js";
import { Data } from "./data.js";
import { AC } from "./autocomplete.js";
import { AutoCycle } from "./autocycle.js";
import { getPromptWidget, syncPromptTagState } from "./utils.js";

const ANIMA_SIZE_KEY = "_anima_saved_size";

function isAnimaNode(node) {
    const cls = String(node?.comfyClass || node?.type || node?.constructor?.comfyClass || "");
    const title = String(node?.title || "");
    return cls === "AnimaStyleExplorer" || title.includes("Anima Style Explorer");
}

function ensureWidgetArray(node) {
    if (!node) return [];
    if (!Array.isArray(node.widgets)) node.widgets = [];
    return node.widgets;
}

function ensureNodeProperties(node) {
    if (!node) return {};
    if (!node.properties || typeof node.properties !== "object") node.properties = {};
    return node.properties;
}

function normalizeSizePair(value) {
    if (!Array.isArray(value) || value.length < 2) return null;
    const width = Number(value[0]) || 0;
    const height = Number(value[1]) || 0;
    if (width <= 0 || height <= 0) return null;
    return [width, height];
}

function readStoredNodeSize(node) {
    const props = ensureNodeProperties(node);
    return normalizeSizePair(props[ANIMA_SIZE_KEY]);
}

function writeStoredNodeSize(node, value) {
    const normalized = normalizeSizePair(value);
    if (!normalized) return null;
    const props = ensureNodeProperties(node);
    props[ANIMA_SIZE_KEY] = normalized;
    return normalized;
}

function ensureResizePersistence(node) {
    if (!node || node._animaSizePersistenceAttached) return;
    node._animaSizePersistenceAttached = true;

    const originalSetSize = typeof node.setSize === "function" ? node.setSize.bind(node) : null;
    if (originalSetSize) {
        node.setSize = function (size) {
            const result = originalSetSize(size);
            const next = normalizeSizePair(this.size) || normalizeSizePair(size);
            if (next) writeStoredNodeSize(this, next);
            return result;
        };
    }

    const originalOnConfigure = typeof node.onConfigure === "function" ? node.onConfigure : null;
    node.onConfigure = function () {
        const result = originalOnConfigure?.apply(this, arguments);
        const incoming = arguments[0];
        const configured = normalizeSizePair(incoming?.properties?.[ANIMA_SIZE_KEY])
            || normalizeSizePair(incoming?.size)
            || normalizeSizePair(this.size);
        if (configured) writeStoredNodeSize(this, configured);
        return result;
    };

    const originalOnResize = typeof node.onResize === "function" ? node.onResize : null;
    node.onResize = function () {
        const result = originalOnResize?.apply(this, arguments);
        const resized = normalizeSizePair(arguments[0]) || normalizeSizePair(this.size);
        if (resized) writeStoredNodeSize(this, resized);
        return result;
    };

    if (!readStoredNodeSize(node)) {
        writeStoredNodeSize(node, node.size);
    }
}

function refreshNodeCanvas(node) {
    if (!node) return;
    try {
        node.setDirtyCanvas?.(true, true);
        app.graph?.setDirtyCanvas?.(true, true);
    } catch { }
}

function growNodeIfNeeded(node) {
    if (!node) return;
    try {
        const current = normalizeSizePair(node.size) || [0, 0];
        const stored = readStoredNodeSize(node) || current;
        const computed = Array.isArray(node.computeSize?.()) ? node.computeSize() : null;
        if (!computed || computed.length !== 2) {
            refreshNodeCanvas(node);
            return;
        }

        const next = [
            Math.max(stored[0], Number(computed[0]) || 0),
            Math.max(stored[1], Number(computed[1]) || 0),
        ];

        if (next[0] !== current[0] || next[1] !== current[1]) {
            node.setSize?.(next);
        }
        refreshNodeCanvas(node);
    } catch { }
}

function ensureTagDisplayWidget(node) {
    if (!node || typeof node.addCustomWidget !== "function") return false;
    const widgets = ensureWidgetArray(node);
    const existing = widgets.find((widget) => String(widget?.name || "") === "_tag_display");
    if (existing) return false;

    node.addCustomWidget({
        name: "_tag_display",
        type: "anima_tag",
        value: "",
        draw(ctx, n, width, y) {
            const promptWidget = getPromptWidget(n);
            if (promptWidget) syncPromptTagState(n, String(promptWidget.value || ""));
            const tag = n._currentTag;
            if (!tag) return;
            const kind = String(n._currentTagKind || "style").toUpperCase();
            ctx.save();
            ctx.fillStyle = kind === "CHARACTER" ? "#111827" : "#0f1324";
            ctx.strokeStyle = kind === "CHARACTER" ? "#31515f" : "#2b3552";
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(8, y + 2, width - 16, 20, 4);
            } else {
                ctx.rect(8, y + 2, width - 16, 20);
            }
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = kind === "CHARACTER" ? "#9bd7ef" : "#aebce2";
            ctx.font = "500 10px 'JetBrains Mono',monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${kind} @${tag.replace(/_/g, " ")}`, width / 2, y + 15);
            ctx.restore();
        },
        computeSize() { return [0, 26]; },
        serialize: false,
    });
    return true;
}

function ensureBadge() {
    if (document.getElementById("anima-badge")) return;
    const badge = document.createElement("div");
    badge.id = "anima-badge";
    const canvas = document.getElementById("graph-canvas");
    (canvas?.parentElement ?? document.body).appendChild(badge);
}

function attachTextareaAutocomplete(node, delay = 400) {
    setTimeout(() => {
        node.widgets?.forEach((widget) => {
            if (widget?.inputEl?.tagName === "TEXTAREA") {
                AC.attach(widget.inputEl);
            }
        });
    }, delay);
}

async function openStyleBrowser(node) {
    try {
        const mod = await import("./browser.js");
        const browser = mod?.Browser;
        if (!browser) throw new Error("Browser module unavailable");
        browser.open((artist, options) => AutoCycle.inject(node, artist, options), node);
        AutoCycle.bindControls?.(document.getElementById("anima-browser"));
        const cycleBtn = browser.cycleBtn?.();
        if (cycleBtn) {
            cycleBtn.onclick = (event) => {
                event?.preventDefault?.();
                event?.stopPropagation?.();
                AutoCycle.toggle(node);
            };
        }
    } catch (error) {
        console.error("[AnimaStyleExplorer] Failed to load Style Browser", error);
        alert("Could not load Style Browser. Reload ComfyUI and check the browser console.");
    }
}

function ensureButtonWidget(node, name, callback) {
    const widgets = ensureWidgetArray(node);
    let widget = widgets.find((item) => String(item?.name || "") === name && String(item?.type || "") === "button");
    if (widget) {
        widget.callback = callback;
        return false;
    }
    if (typeof node.addWidget !== "function") return false;
    widget = node.addWidget("button", name, null, callback);
    return !!widget;
}

function moveWidgetsToBottom(node, names = []) {
    const widgets = ensureWidgetArray(node);
    if (!widgets.length) return false;

    const wanted = names
        .map((name) => widgets.find((widget) => String(widget?.name || "") === name))
        .filter(Boolean);
    if (!wanted.length) return false;

    const others = widgets.filter((widget) => !wanted.includes(widget));
    const next = [...others, ...wanted];
    const changed = next.some((widget, index) => widget !== widgets[index]);
    if (!changed) return false;

    widgets.length = 0;
    widgets.push(...next);
    return true;
}

function patchNode(node, force = false) {
    if (!node || (!force && !isAnimaNode(node))) return;
    ensureResizePersistence(node);

    const addedRandom = ensureButtonWidget(node, "Random Style", () => {
        Data.random().then((artist) => {
            if (artist) AutoCycle.inject(node, artist);
        }).catch(() => { });
    });

    const addedBrowser = ensureButtonWidget(node, "Style Browser", () => {
        openStyleBrowser(node);
    });

    const addedTag = ensureTagDisplayWidget(node);
    moveWidgetsToBottom(node, ["_tag_display", "Style Browser", "Random Style"]);
    ensureBadge();

    growNodeIfNeeded(node);

    if (addedRandom || addedBrowser || addedTag) {
        setTimeout(() => growNodeIfNeeded(node), 120);
        setTimeout(() => growNodeIfNeeded(node), 320);
    }
}

function schedulePatch(node, force = false) {
    patchNode(node, force);
    setTimeout(() => patchNode(node, force), 80);
    setTimeout(() => patchNode(node, force), 260);
    setTimeout(() => patchNode(node, force), 900);
}

app.registerExtension({
    name: "AnimaStyleExplorer",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "AnimaStyleExplorer") return;
        injectCSS();

        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origOnNodeCreated?.apply(this, arguments);
            schedulePatch(this, true);
            attachTextareaAutocomplete(this, 400);
        };
    },

    nodeCreated(node) {
        schedulePatch(node);
        attachTextareaAutocomplete(node, 500);
    },

    loadedGraphNode(node) {
        schedulePatch(node);
        attachTextareaAutocomplete(node, 160);
    },

    setup() {
        [60, 220, 700, 1400].forEach((delay) => {
            setTimeout(() => {
                const nodes = app.graph?._nodes || [];
                for (const node of nodes) {
                    patchNode(node);
                }
            }, delay);
        });
    },
});
