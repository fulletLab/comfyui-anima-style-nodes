import { CACHE_KEY, CACHE_TTL } from "./config.js";

export const Data = (() => {
    let _promise = null;
    let _animadexPromise = null;

    function _animadexEnabled() {
        try {
            return localStorage.getItem("anima_animadex_enabled") === "true";
        } catch {
            return false;
        }
    }

    function _filterSources(list = [], { includeAnimadex = _animadexEnabled() } = {}) {
        if (includeAnimadex) return list;
        return list.filter((item) => String(item?.source || "").toLowerCase() !== "animadex");
    }

    function _isCharacter(item) {
        return String(item?.source_kind || "").toLowerCase() === "character";
    }

    async function _load() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
                const { ts, list } = JSON.parse(raw);
                if (Date.now() - ts < CACHE_TTL) return list;
            }
        } catch (_) { }

        try {
            const r = await fetch("/anima/artists");
            if (r.ok) {
                const list = await r.json();
                list.forEach(a => {
                    a._s = (a.tag + " " + (a.name || "")).toLowerCase();
                });
                _persist(list);
                return list;
            }
        } catch (_) { }

        return [];
    }

    function _prepareSearch(list = []) {
        list.forEach(a => {
            a._s = (a.tag + " " + (a.name || "")).toLowerCase();
        });
        return list;
    }

    async function _loadAnimadex() {
        try {
            const r = await fetch("/anima/artists?source=animadex");
            if (r.ok) {
                const list = await r.json();
                return _prepareSearch(Array.isArray(list) ? list : []);
            }
        } catch (_) { }

        const merged = await all({ includeAnimadex: true });
        return merged.filter((item) => String(item?.source || "").toLowerCase() === "animadex");
    }

    function _persist(list) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), list })); } catch (_) { }
    }

    async function all(options = {}) {
        const list = await (_promise || (_promise = _load()));
        return _filterSources(Array.isArray(list) ? list : [], options);
    }
    async function animadex(kind = "") {
        const list = await (_animadexPromise || (_animadexPromise = _loadAnimadex()));
        const sourceKind = String(kind || "").trim().toLowerCase();
        if (!sourceKind) return list;
        return list.filter((item) => String(item?.source_kind || "").toLowerCase() === sourceKind);
    }
    function reset() {
        _promise = null;
        _animadexPromise = null;
        localStorage.removeItem(CACHE_KEY);
    }

    async function search(q) {
        const list = await all();
        if (!q) return list;
        const lq = q.toLowerCase();
        return list.filter(a => a._s.includes(lq));
    }

    async function randomStyle() {
        const list = await all();
        const styles = list.filter((item) => !_isCharacter(item));
        return styles.length ? styles[Math.floor(Math.random() * styles.length)] : null;
    }

    async function random() {
        return randomStyle();
    }

    return { all, animadex, reset, search, random, randomStyle };
})();
