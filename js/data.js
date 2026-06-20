import { CACHE_KEY, CACHE_TTL } from "./config.js";

export const Data = (() => {
    const _promises = new Map();
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

    function _cacheKey(includeAnimadex) {
        return includeAnimadex ? `${CACHE_KEY}:with_animadex` : `${CACHE_KEY}:legacy`;
    }

    async function _load(includeAnimadex = false) {
        const cacheKey = _cacheKey(includeAnimadex);
        try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
                const { ts, list } = JSON.parse(raw);
                if (Date.now() - ts < CACHE_TTL) return list;
            }
        } catch (_) { }

        try {
            const r = await fetch(includeAnimadex ? "/anima/artists?animadex=1" : "/anima/artists");
            if (r.ok) {
                const list = await r.json();
                list.forEach(a => {
                    a._s = (a.tag + " " + (a.name || "")).toLowerCase();
                });
                _persist(list, includeAnimadex);
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

    function _persist(list, includeAnimadex = false) {
        try { localStorage.setItem(_cacheKey(includeAnimadex), JSON.stringify({ ts: Date.now(), list })); } catch (_) { }
    }

    async function all(options = {}) {
        const includeAnimadex = Object.prototype.hasOwnProperty.call(options, "includeAnimadex")
            ? !!options.includeAnimadex
            : _animadexEnabled();
        const key = includeAnimadex ? "with_animadex" : "legacy";
        const list = await (_promises.get(key) || (_promises.set(key, _load(includeAnimadex)), _promises.get(key)));
        return _filterSources(Array.isArray(list) ? list : [], options);
    }
    async function animadex(kind = "") {
        const list = await (_animadexPromise || (_animadexPromise = _loadAnimadex()));
        const sourceKind = String(kind || "").trim().toLowerCase();
        if (!sourceKind) return list;
        return list.filter((item) => String(item?.source_kind || "").toLowerCase() === sourceKind);
    }
    function reset() {
        _promises.clear();
        _animadexPromise = null;
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(_cacheKey(false));
        localStorage.removeItem(_cacheKey(true));
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
