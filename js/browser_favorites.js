import {
    favoriteKeyFromItem,
    isFulletLike,
    normalizeTag,
    sortByDateDesc,
} from "./browser_helpers.js";

export function rebuildFavoriteMap(localFavorites = [], remoteFavorites = []) {
    const map = new Map();
    for (const item of localFavorites) {
        const key = favoriteKeyFromItem(item);
        if (!key) continue;
        map.set(key, item);
    }
    for (const post of remoteFavorites) {
        const key = favoriteKeyFromItem({ kind: "fullet", id: post?.id });
        if (!key || map.has(key)) continue;
        map.set(key, {
            key,
            kind: "fullet",
            ...post,
        });
    }
    return map;
}

export async function loadLocalFavorites(api) {
    try {
        const r = await api.fetchApi("/anima/favorites");
        const data = await r.json().catch(() => ({}));
        return Array.isArray(data.items) ? data.items : [];
    } catch {
        return [];
    }
}

export async function mutateLocalFavorites(api, headers, payload) {
    try {
        const r = await api.fetchApi("/anima/favorites", {
            method: "POST",
            headers: {
                ...(headers || {}),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload || {}),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            return {
                ok: false,
                error: data?.error || `Favorite update failed (${r.status})`,
                status: r.status,
            };
        }
        return {
            ok: true,
            data,
            items: Array.isArray(data.items) ? data.items : [],
            status: r.status,
        };
    } catch (err) {
        return { ok: false, error: err?.message || "Favorite update failed", status: 0 };
    }
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

export async function exportLocalFavorites(api) {
    const response = await api.fetchApi("/anima/favorites/export");
    if (!response.ok) {
        throw new Error(`Favorites export failed (${response.status})`);
    }
    const blob = await response.blob();
    downloadBlob(blob, `anima-favorites-${timestampForFilename()}.json`);
}

export async function importLocalFavorites(api, headers, file) {
    if (!file) return [];
    const payload = JSON.parse(await file.text());
    const result = await mutateLocalFavorites(api, headers, {
        action: "import",
        items: Array.isArray(payload?.items) ? payload.items : [],
    });
    if (!result.ok) {
        throw new Error(result.error || "Favorites import failed");
    }
    return result.items;
}

export async function loadRemoteFavorites(api, { limit = 96, offset = 0 } = {}) {
    try {
        const r = await api.fetchApi(`/anima/fullet_favorites?limit=${limit}&offset=${offset}`);
        const data = await r.json().catch(() => ({}));
        return Array.isArray(data.posts) ? data.posts : [];
    } catch {
        return [];
    }
}

export async function syncRemoteFavorite(api, headers, { postId, favorited }) {
    try {
        const r = await api.fetchApi("/anima/fullet_favorite", {
            method: "POST",
            headers: {
                ...(headers || {}),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                postId: String(postId || ""),
                favorited: !!favorited,
            }),
        });

        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            return {
                ok: false,
                error: data?.error || `Remote favorite update failed (${r.status})`,
                status: r.status,
            };
        }
        return { ok: true, data, status: r.status };
    } catch (err) {
        return { ok: false, error: err?.message || "Remote favorite update failed", status: 0 };
    }
}

function mergeStyleFavoriteSnapshot(snapshot = {}, known = null) {
    const base = known && typeof known === "object" ? { ...known } : {};
    const merged = {
        ...base,
        ...snapshot,
        tag: normalizeTag(snapshot?.tag || known?.tag || ""),
        id: String(snapshot?.id ?? known?.id ?? "").trim(),
        p: Number(snapshot?.p ?? known?.p ?? 1) || 1,
        works: Number(snapshot?.works ?? known?.works ?? 0) || 0,
        uniqueness_score: Number(snapshot?.uniqueness_score ?? known?.uniqueness_score ?? 0) || 0,
        source: String(snapshot?.source || known?.source || "").trim(),
        source_kind: String(snapshot?.source_kind || known?.source_kind || "").trim(),
        slug: String(snapshot?.slug || known?.slug || "").trim(),
        thumb_url: String(snapshot?.thumb_url || known?.thumb_url || "").trim(),
        img_url: String(snapshot?.img_url || known?.img_url || "").trim(),
        addedAt: String(snapshot?.addedAt || ""),
        _kind: "style",
        _favoriteKey: String(snapshot?.key || favoriteKeyFromItem(snapshot)),
        _preferLocalThumb: !!snapshot?.localPreviewCached,
        localPreviewCached: !!snapshot?.localPreviewCached,
    };

    if (!merged._s) {
        merged._s = `${merged.tag || ""} ${merged.name || ""}`.trim().toLowerCase();
    }
    return merged;
}

export function buildFavoritesList({
    artists = [],
    localFavorites = [],
    remoteFavorites = [],
    filter = "",
}) {
    const byTag = new Map(artists.map((artist) => [normalizeTag(artist?.tag || ""), artist]));
    const merged = new Map();

    for (const item of localFavorites) {
        const key = favoriteKeyFromItem(item);
        if (!key) continue;
        merged.set(key, { ...item });
    }

    for (const post of remoteFavorites) {
        const key = favoriteKeyFromItem({ kind: "fullet", id: post?.id || "" });
        if (!key) continue;
        const prev = merged.get(key) || {};
        merged.set(key, {
            ...prev,
            kind: "fullet",
            id: String(post?.id || "").trim(),
            username: String(post?.username || "").trim(),
            prompt: String(post?.prompt || "").trim(),
            artist: String(post?.artist || "").trim(),
            imageUrl: String(post?.imageUrl || "").trim(),
            thumbnailUrl: String(post?.thumbnailUrl || prev?.thumbnailUrl || "").trim(),
            createdAt: String(post?.createdAt || "").trim(),
            postUrl: String(post?.postUrl || "").trim(),
            key,
            addedAt: String(prev?.addedAt || post?.createdAt || ""),
        });
    }

    let list = [];
    for (const item of merged.values()) {
        if (String(item?.kind || "") === "style") {
            const tag = normalizeTag(item?.tag || "");
            const known = byTag.get(tag);
            list.push(mergeStyleFavoriteSnapshot({ ...item, tag }, known));
        } else {
            list.push({ ...item, _kind: "fullet", kind: "fullet" });
        }
    }

    list = sortByDateDesc(list);

    if (filter) {
        const q = filter.toLowerCase();
        list = list.filter((item) => {
            if (isFulletLike(item)) {
                const hay = `${item.artist || ""} ${item.username || ""} ${item.prompt || ""}`.toLowerCase();
                return hay.includes(q);
            }
            const hay = `${item.tag || ""} ${item.name || ""}`.toLowerCase();
            return hay.includes(q);
        });
    }

    return list;
}

