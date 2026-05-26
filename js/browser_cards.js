import { escapeHtml } from "./browser_helpers.js";

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

function characterTriggerParts(artist, mode = "trigger") {
    const trigger = splitPromptTagList(artist?.trigger || artist?.tag || "");
    const tags = Array.isArray(artist?.tags)
        ? splitPromptTagList(artist.tags)
        : [];
    return mode === "trigger-tags"
        ? [...trigger, ...tags].filter(Boolean)
        : trigger;
}

async function copyText(text) {
    const value = String(text || "").trim();
    if (!value) return false;
    try {
        await navigator.clipboard?.writeText?.(value);
        return true;
    } catch {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
    }
}

function showCharacterActionMenu(mediaEl, artist, mode, onAdd) {
    if (!mediaEl) return;
    const text = characterTriggerParts(artist, mode).join(", ");
    if (!text) return;

    mediaEl.querySelector(".anima-card-action-menu")?.remove();

    const menu = document.createElement("div");
    menu.className = "anima-card-action-menu";
    menu.innerHTML = `
        <span class="anima-card-action-title">${escapeHtml(mode === "trigger-tags" ? "Trigger + tags" : "Trigger")}</span>
        <span class="anima-card-action-text" title="${escapeHtml(text)}">${escapeHtml(text)}</span>
        <div class="anima-card-action-row">
            <button type="button" data-action="copy">Copy</button>
            <button type="button" data-action="add">Add to Prompt</button>
        </div>
    `;

    menu.addEventListener("click", (e) => e.stopPropagation());
    menu.querySelector("[data-action='copy']")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const ok = await copyText(text);
        btn.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(() => {
            if (btn.isConnected) btn.textContent = "Copy";
        }, 900);
    });
    menu.querySelector("[data-action='add']")?.addEventListener("click", (e) => {
        e.stopPropagation();
        onAdd?.(mode, menu);
        menu.remove();
    });

    mediaEl.appendChild(menu);
    mediaEl.addEventListener("mouseleave", () => {
        setTimeout(() => menu.remove(), 160);
    }, { once: true });
}

function closeStyleApplyModal() {
    document.querySelector(".anima-style-apply-modal")?.remove();
}

function showStyleActionMenu(mediaEl, artist, onApply, getStyleSlots) {
    const displayTag = String(artist?.tag || "").replace(/^@+/, "").replace(/_/g, " ").trim();
    if (!displayTag) return;

    const slots = typeof getStyleSlots === "function" ? getStyleSlots() : [];
    closeStyleApplyModal();

    const slotButtons = slots.map((slot, index) => `
        <button class="anima-style-apply-choice" type="button" data-style-action="replace-index" data-replace-index="${index}">
            Replace ${index + 1}: ${escapeHtml(slot.label || slot.token || "")}
        </button>
    `).join("");

    const replaceButtons = slots.length > 1
        ? `
            <button class="anima-style-apply-choice" type="button" data-style-action="replace-all">Replace All Artists</button>
            <div class="anima-style-apply-list">${slotButtons}</div>
          `
        : slots.length === 1
            ? `<button class="anima-style-apply-choice" type="button" data-style-action="replace-index" data-replace-index="0">Replace Current Artist</button>`
            : "";

    const modal = document.createElement("div");
    modal.className = "anima-style-apply-modal";
    modal.innerHTML = `
        <div class="anima-style-apply-backdrop" data-style-close="1"></div>
        <div class="anima-style-apply-panel" role="dialog" aria-modal="true" aria-label="Apply style">
            <div class="anima-style-apply-head">
                <div>
                    <strong>Apply Style</strong>
                    <span>@${escapeHtml(displayTag)}</span>
                </div>
                <button type="button" class="anima-style-apply-close" data-style-close="1" title="Close">&#10005;</button>
            </div>
            <div class="anima-style-apply-body">
                <button class="anima-style-apply-choice anima-style-apply-primary" type="button" data-style-action="add">Add to Prompt</button>
                ${replaceButtons}
                ${slots.length ? "" : `<p class="anima-style-apply-empty">No artist tag is currently in the prompt. This will add the style.</p>`}
            </div>
        </div>
    `;

    const host = document.getElementById("anima-browser") || document.body;
    host.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target?.dataset?.styleClose) close();
    });
    modal.querySelectorAll("[data-style-action]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onApply?.("style", modal.querySelector(".anima-style-apply-panel") || mediaEl, {
                styleAction: btn.dataset.styleAction || "replace-all",
                replaceIndex: btn.dataset.replaceIndex,
            });
            close();
        });
    });
}

export function createFulletCard({
    post,
    isFav = false,
    onApply,
    onToggleFavorite,
    onOpenSwipe,
}) {
    const card = document.createElement("div");
    card.className = "anima-fullet-card";

    const artist = String(post?.artist || "").replace(/_/g, " ").trim();
    const user = String(post?.username || "").trim();
    const imageUrl = String(post?.displayImageUrl || post?.thumbnailUrl || post?.imageUrl || "").trim();
    const postUrl = String(post?.postUrl || "").trim();

    card.innerHTML = `
        <div class="anima-fullet-img" data-init="${escapeHtml((artist[0] || "?").toUpperCase())}">
            ${imageUrl ? `<img loading="lazy" decoding="async" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(artist)}" onerror="this.style.display='none';this.parentElement.classList.add('no-img')"/>` : ""}
        </div>
        <div class="anima-fullet-meta">
            <span class="anima-fullet-artist" title="@${escapeHtml(artist)}">@${escapeHtml(artist)}</span>
            <span class="anima-fullet-user">by @${escapeHtml(user)}</span>

            <div class="anima-fullet-actions anima-fullet-actions-main">
                <button class="anima-card-pick" data-apply="both">Apply</button>
            </div>

            <div class="anima-fullet-actions anima-fullet-actions-secondary">
                <button class="anima-fullet-mini" data-apply="prompt">Prompt</button>
                <button class="anima-fullet-mini" data-apply="artist">Artist</button>
                <button class="anima-fullet-mini" data-favorite="toggle">${isFav ? "Unfavorite" : "Favorite"}</button>
                ${postUrl ? `<a href="${escapeHtml(postUrl)}" target="_blank" rel="noopener" class="anima-fullet-mini anima-fullet-mini-link">Open</a>` : ""}
            </div>
        </div>
    `;

    const mediaEl = card.querySelector(".anima-fullet-img");

    card.querySelectorAll("[data-apply]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onApply?.(post, btn.dataset.apply || "both", mediaEl || btn);
        });
    });

    const favBtn = card.querySelector("[data-favorite='toggle']");
    favBtn?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const res = await onToggleFavorite?.(post, favBtn, mediaEl || favBtn);
        if (res?.ok && typeof res.favorited === "boolean") {
            favBtn.textContent = res.favorited ? "Unfavorite" : "Favorite";
        }
    });

    card.addEventListener("mousedown", (e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        onOpenSwipe?.(post);
    });

    card.addEventListener("click", () => onApply?.(post, "both", mediaEl || card));
    return card;
}

export function createStyleCard({
    artist,
    imageUrl,
    isUniq = false,
    isFav = false,
    onApply,
    onToggleFavorite,
    onOpenSwipe,
    getStyleSlots,
}) {
    const card = document.createElement("div");
    card.className = "anima-card";
    card.dataset.tag = artist.tag;

    const rankHtml = isUniq && artist.uniquenessRank
        ? `<div class="anima-uniqueness-rank" title="Uniqueness score: ${Number(artist.uniqueness_score || 0).toFixed(2)}">#${artist.uniquenessRank}</div>`
        : "";
    const source = String(artist?.source || "").toLowerCase();
    const sourceKind = String(artist?.source_kind || "").toLowerCase();
    const isCharacter = sourceKind === "character";
    const sourceLabel = sourceKind === "artist" ? "STYLE" : sourceKind === "character" ? "CHARACTER" : sourceKind;
    const sourceBadge = source === "animadex"
        ? `<span class="anima-card-source anima-card-source-${escapeHtml(sourceKind || "animadex")}">${escapeHtml(sourceLabel || "ANIMADEX")}</span>`
        : "";
    const worksLabel = source === "animadex" ? "images" : "works";
    const fitClass = source === "animadex" ? "anima-card-img-contain" : "";
    const displayTag = String(artist.tag || "").replace(/_/g, " ");
    const triggerText = String(artist?.trigger || displayTag).replace(/^@+/, "");
    const titlePrefix = isCharacter ? "" : "@";
    const overlayButtons = isCharacter
        ? `
                <button class="anima-card-pick" data-apply="trigger">Trigger</button>
                <button class="anima-card-fav anima-card-trigger-tags" data-apply="trigger-tags">Trigger + tags</button>
          `
        : `
                <button class="anima-card-pick" data-apply="style">Apply Style</button>
                <button class="anima-card-fav" data-favorite="toggle">${isFav ? "Unfavorite" : "Favorite"}</button>
          `;
    const tagsPreview = isCharacter && Array.isArray(artist?.tags) && artist.tags.length
        ? `<span class="anima-card-tags-preview" title="${escapeHtml(artist.tags.join(", "))}">${escapeHtml(artist.tags.slice(0, 4).join(", "))}${artist.tags.length > 4 ? "..." : ""}</span>`
        : "";

    const imageHtml = imageUrl
        ? `<img loading="lazy" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(artist.tag || "")}" onerror="this.style.display='none';this.parentElement.classList.add('no-img')"/>`
        : "";

    card.innerHTML = `
        <div class="anima-card-img ${fitClass} ${imageUrl ? "" : "no-img"}" data-init="${escapeHtml((artist.tag?.[0] || "?").toUpperCase())}">
            ${imageHtml}
            ${rankHtml}
            <div class="anima-card-overlay">
                ${overlayButtons}
            </div>
        </div>
        <div class="anima-card-meta">
            <span class="anima-card-tag" title="${escapeHtml(titlePrefix + displayTag)}">${escapeHtml(titlePrefix + displayTag)}</span>
            ${isCharacter ? `<span class="anima-card-trigger" title="${escapeHtml(triggerText)}">Trigger: ${escapeHtml(triggerText)}</span>` : ""}
            ${tagsPreview}
            ${(!isUniq && artist.works) ? `<span class="anima-card-works">${Number(artist.works).toLocaleString()} ${worksLabel}${sourceBadge}</span>` : sourceBadge}
        </div>
    `;

    const mediaEl = card.querySelector(".anima-card-img");

    card.addEventListener("mouseenter", () => {
        if (!imageUrl) return;
        const img = card.querySelector("img");
        if (img && (!img.complete || img.naturalWidth === 0)) {
            img.src = imageUrl + (imageUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
        }
    }, { once: true });

    card.addEventListener("mousedown", (e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        onOpenSwipe?.(artist);
    });

    const pick = (mode = "style", anchorEl = mediaEl || card, extraOptions = {}) => onApply?.(artist, anchorEl, mode, extraOptions);
    card.querySelectorAll("[data-apply]").forEach((btn) => btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const mode = btn.dataset.apply || "style";
        if (isCharacter) {
            showCharacterActionMenu(mediaEl, artist, mode, pick);
            return;
        }
        showStyleActionMenu(mediaEl, artist, pick, getStyleSlots);
    }));

    const favBtn = card.querySelector("[data-favorite='toggle']");
    favBtn?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const res = await onToggleFavorite?.(artist, favBtn, mediaEl || favBtn);
        if (res?.ok && typeof res.favorited === "boolean") {
            favBtn.textContent = res.favorited ? "Unfavorite" : "Favorite";
        }
    });

    card.addEventListener("click", () => {
        if (isCharacter) {
            showCharacterActionMenu(mediaEl, artist, "trigger", pick);
            return;
        }
        showStyleActionMenu(mediaEl, artist, pick, getStyleSlots);
    });
    return card;
}
