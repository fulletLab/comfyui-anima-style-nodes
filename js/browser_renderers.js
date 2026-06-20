export function renderRemoteGate(grid, onEnable) {
    grid.innerHTML = `
        <div class="anima-empty anima-net-gate">
            <strong>Internet Required</strong>
            <span>
                Fullet Prompts loads live posts from Fullet. Enable internet access only when you want to browse,
                search, or apply community prompts in this tab.
            </span>
            <button class="hdr-btn-txt" id="anima-enable-remote">Enable Internet Access</button>
        </div>
    `;
    const btn = grid.querySelector("#anima-enable-remote");
    btn?.addEventListener("click", async () => {
        await onEnable?.();
    });
}

export function renderChunkedGrid({
    grid,
    observer,
    items,
    chunkSize,
    minHeight,
    renderItem,
    append = false,
}) {
    if (!append) {
        if (observer) observer.disconnect();
        grid.innerHTML = "";
    }

    for (let i = 0; i < items.length; i += chunkSize) {
        const chunkItems = items.slice(i, i + chunkSize);
        const chunk = document.createElement("div");
        chunk.className = "anima-chunk";
        chunk.style.minHeight = minHeight;
        chunk._mount = () => {
            if (chunk.children.length) return;
            const frag = document.createDocumentFragment();
            chunkItems.forEach((item) => {
                const node = renderItem?.(item);
                if (node) frag.appendChild(node);
            });
            chunk.appendChild(frag);
            chunk.style.minHeight = "";
        };
        chunk._unmount = () => {
            if (!chunk.children.length) return;
            chunk.style.minHeight = `${chunk.offsetHeight}px`;
            chunk.innerHTML = "";
        };
        grid.appendChild(chunk);
        observer?.observe(chunk);
    }
}

export function buildFulletList(posts = [], filter = "") {
    let list = [...posts];
    if (!filter) return list;

    const q = filter.toLowerCase();
    list = list.filter((item) => {
        const hay = `${item.artist || ""} ${item.username || ""} ${item.prompt || ""}`.toLowerCase();
        return hay.includes(q);
    });
    return list;
}

export function buildStyleList(styles = [], { sort = "works", filter = "" } = {}) {
    let list = [...styles];

    if (sort === "latest") {
        const latestTime = (item) => {
            const generatedAt = Number(item?.generatedAt || 0);
            if (Number.isFinite(generatedAt) && generatedAt > 0) return generatedAt;
            const rawDate = String(item?.addedAt || item?.createdAt || "").trim();
            if (!rawDate) return 0;
            return Date.parse(rawDate) || 0;
        };
        list.sort((a, b) => {
            const bTime = latestTime(b);
            const aTime = latestTime(a);
            const t = bTime - aTime;
            if (t) return t;
            const w = (Number(b.works) || 0) - (Number(a.works) || 0);
            if (w) return w;
            return (a.tag || "").localeCompare(b.tag || "");
        });
    } else if (sort === "name") {
        list.sort((a, b) => (a.tag || "").localeCompare(b.tag || ""));
    } else if (sort === "uniqueness") {
        list.sort((a, b) => {
            const u = (Number(b.uniqueness_score) || 0) - (Number(a.uniqueness_score) || 0);
            if (u) return u;
            const w = (Number(b.works) || 0) - (Number(a.works) || 0);
            if (w) return w;
            return (a.tag || "").localeCompare(b.tag || "");
        });
        list.forEach((artist, i) => {
            artist.uniquenessRank = i + 1;
        });
    } else {
        list.sort((a, b) => (Number(b.works) || 0) - (Number(a.works) || 0));
    }

    if (filter) {
        const lq = filter.toLowerCase();
        list = list.filter((artist) => (artist._s ?? String(artist.tag || "").toLowerCase()).includes(lq));
    }

    return list;
}
