export const Swipe = (() => {
    const PRELOAD_WINDOW = 15;
    const PRELOAD_TRIGGER_OFFSET = 5;

    let el = null;
    let container = null;
    let prevImg = null;
    let curImg = null;
    let nextImg = null;
    let titleEl = null;
    let counterEl = null;
    let favoriteBtn = null;
    let categorySelect = null;

    let _list = [];
    let _index = 0;
    let _onApply = null;
    let _onToggleFavorite = null;
    let _onSetFavoriteCategory = null;
    let _getImageUrl = null;
    let _getTitle = null;
    let _isFavorited = null;
    let _getFavoriteCategory = null;
    let _getFavoriteCategoryOptions = null;
    let _pendingFavoriteCategory = "";
    let _favoriteCategoryTarget = null;

    let _keyHandler = null;
    const _preloaded = new Set();
    let _preloadedAheadIndex = -1;
    let _preloadedBehindIndex = -1;
    let _previousBodyOverflow = "";

    function _build() {
        if (document.getElementById("anima-swipe")) return;

        el = document.createElement("div");
        el.id = "anima-swipe";
        el.className = "hidden";
        el.innerHTML = `
            <div class="backdrop"></div>
            <div class="swipe-header">
                <span class="swipe-counter" id="anima-swipe-counter"></span>
                <span class="swipe-title" id="anima-swipe-title"></span>
                <div class="swipe-actions">
                    <button class="swipe-favorite" id="anima-swipe-favorite" title="Toggle favorite">Favorite</button>
                    <select class="swipe-category" id="anima-swipe-category" title="Save to favorite category"></select>
                    <button class="swipe-close" id="anima-swipe-close" title="Close">&#10005;</button>
                </div>
            </div>
            <div class="swipe-container" id="anima-swipe-container">
                <img class="swipe-image swipe-image--prev" id="anima-swipe-prev" alt="" loading="eager"/>
                <img class="swipe-image swipe-image--current" id="anima-swipe-current" alt="" loading="eager"/>
                <img class="swipe-image swipe-image--next" id="anima-swipe-next" alt="" loading="eager"/>
            </div>
            <div class="swipe-hint">&#8592;/&#8594; navigate &#183; Enter apply &#183; F favorite &#183; C copy &#183; Esc close</div>
        `;
        document.body.appendChild(el);

        container = el.querySelector("#anima-swipe-container");
        prevImg = el.querySelector("#anima-swipe-prev");
        curImg = el.querySelector("#anima-swipe-current");
        nextImg = el.querySelector("#anima-swipe-next");
        titleEl = el.querySelector("#anima-swipe-title");
        counterEl = el.querySelector("#anima-swipe-counter");
        favoriteBtn = el.querySelector("#anima-swipe-favorite");
        categorySelect = el.querySelector("#anima-swipe-category");

        el.querySelector(".backdrop").addEventListener("click", close);
        el.querySelector("#anima-swipe-close").addEventListener("click", close);
        favoriteBtn?.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            _toggleFavorite();
        });
        categorySelect?.addEventListener("change", (e) => {
            e.preventDefault();
            e.stopPropagation();
            _favoriteCategoryTarget = String(e.currentTarget.value || "").trim();
            _pendingFavoriteCategory = _favoriteCategoryTarget;
            _syncFavoriteButton();
        });

        prevImg.addEventListener("click", (e) => { e.stopPropagation(); _navigate(-1); });
        nextImg.addEventListener("click", (e) => { e.stopPropagation(); _navigate(1); });
        curImg.addEventListener("click", (e) => { e.stopPropagation(); _apply(); });
    }

    function _normalizeIndex(i, len) {
        if (!len) return 0;
        return ((i % len) + len) % len;
    }

    function _getItem(i) {
        if (!_list?.length) return null;
        return _list[_normalizeIndex(i, _list.length)] ?? null;
    }

    function _urlFor(item) {
        if (!item) return "";
        if (typeof _getImageUrl === "function") return _getImageUrl(item) || "";
        return item.image || "";
    }

    function _titleFor(item) {
        if (!item) return "";
        if (typeof _getTitle === "function") return _getTitle(item) || "";
        return item.tag || item.name || "";
    }

    function _apply() {
        const item = _getItem(_index);
        if (!item) return;
        try { _onApply?.(item); } catch (_) { }
    }

    async function _toggleFavorite() {
        const item = _getItem(_index);
        if (!item || typeof _onToggleFavorite !== "function") return;
        if (favoriteBtn) favoriteBtn.disabled = true;
        try {
            const res = await _onToggleFavorite(item, favoriteBtn, _pendingFavoriteCategory);
            if (res?.ok && typeof res.favorited === "boolean") {
                item._swipeFavorited = res.favorited;
            }
            if (res?.ok && typeof res.category === "string") {
                item.category = res.category;
            }
        } catch (_) {
        } finally {
            _syncFavoriteButton();
            if (favoriteBtn) favoriteBtn.disabled = false;
            _syncCategorySelect();
        }
    }

    function _favoriteState(item) {
        if (!item) return false;
        if (typeof item._swipeFavorited === "boolean") return item._swipeFavorited;
        if (typeof _isFavorited === "function") return !!_isFavorited(item);
        return false;
    }

    function _currentFavoriteCategory(item) {
        if (!item) return "";
        if (typeof _getFavoriteCategory === "function") return String(_getFavoriteCategory(item) || "").trim();
        return String(item?.category || "").trim();
    }

    function _isChangingFavoriteCategory(item) {
        if (!_favoriteState(item)) return false;
        return String(_favoriteCategoryTarget ?? "").trim() !== _currentFavoriteCategory(item);
    }

    function _syncFavoriteButton() {
        if (!favoriteBtn) return;
        const item = _getItem(_index);
        const enabled = !!item && typeof _onToggleFavorite === "function";
        const favorited = _favoriteState(item);
        const changingCategory = _isChangingFavoriteCategory(item);
        el?.classList.toggle("favorited", favorited);
        favoriteBtn.style.display = enabled ? "inline-flex" : "none";
        favoriteBtn.classList.toggle("active", favorited);
        favoriteBtn.textContent = favorited
            ? (changingCategory ? "Move Category" : "Unfavorite")
            : "Favorite";
    }

    function _syncCategorySelect() {
        if (!categorySelect) return;
        const item = _getItem(_index);
        const enabled = !!item && typeof _onSetFavoriteCategory === "function";
        categorySelect.style.display = enabled ? "inline-flex" : "none";
        if (!enabled) return;

        const options = typeof _getFavoriteCategoryOptions === "function"
            ? _getFavoriteCategoryOptions(item)
            : [{ value: "", label: "Uncategorized" }];
        const current = typeof _getFavoriteCategory === "function"
            ? String(_getFavoriteCategory(item) || "")
            : String(item?.category || "");
        if (_favoriteCategoryTarget === null) {
            _favoriteCategoryTarget = current;
        }
        _pendingFavoriteCategory = _favoriteCategoryTarget;
        const escapeOption = (value) => String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        categorySelect.innerHTML = options.map((option) => {
            const value = String(option?.value || "");
            const label = String(option?.label || value || "Uncategorized");
            return `<option value="${escapeOption(value)}" ${value === _favoriteCategoryTarget ? "selected" : ""}>${escapeOption(label)}</option>`;
        }).join("");
        categorySelect.value = _favoriteCategoryTarget;
    }

    function _navigate(delta) {
        if (!_list?.length) return;
        _index = _normalizeIndex(_index + delta, _list.length);
        _update();

        if (delta > 0 && _index + PRELOAD_TRIGGER_OFFSET >= _preloadedAheadIndex) {
            _preloadAhead();
        }
        if (delta < 0 && (_index - PRELOAD_TRIGGER_OFFSET <= _preloadedBehindIndex || _index > _preloadedBehindIndex)) {
            _preloadBehind();
        }
    }

    function _preloadRange(start, end, step = 1) {
        const len = _list.length;
        if (!len) return;

        for (let i = start; step > 0 ? i < end : i > end; i += step) {
            const item = _getItem(i);
            const url = _urlFor(item);
            if (!url || _preloaded.has(url)) continue;
            _preloaded.add(url);
            const img = new Image();
            img.src = url;
        }
    }

    function _preloadAhead() {
        if (!_list.length) return;
        const start = _preloadedAheadIndex + 1;
        const end = Math.min(start + PRELOAD_WINDOW, _list.length);
        _preloadRange(start, end, 1);
        _preloadedAheadIndex = Math.max(_preloadedAheadIndex, end - 1);
    }

    function _preloadBehind() {
        if (!_list.length) return;
        const start = _preloadedBehindIndex - 1;
        const end = Math.max(start - PRELOAD_WINDOW, -1);
        _preloadRange(start, end, -1);
        _preloadedBehindIndex = Math.min(_preloadedBehindIndex, end + 1);
    }

    function _update() {
        if (!_list?.length) return;

        const len = _list.length;
        const prev = _getItem(_index - 1);
        const cur = _getItem(_index);
        const next = _getItem(_index + 1);

        prevImg.src = _urlFor(prev);
        curImg.src = _urlFor(cur);
        nextImg.src = _urlFor(next);

        const title = _titleFor(cur);
        titleEl.textContent = title ? `@${title}` : "";
        counterEl.textContent = `${_index + 1} / ${len}`;
        _syncFavoriteButton();
        _syncCategorySelect();

        // Re-trigger animation
        container?.classList.remove("swipe-transition");
        void container?.offsetWidth;
        container?.classList.add("swipe-transition");
    }

    function _onKey(e) {
        if (!el || el.classList.contains("hidden")) return;

        switch (e.code) {
            case "ArrowLeft":
                e.preventDefault(); e.stopPropagation();
                _navigate(-1);
                break;
            case "ArrowRight":
                e.preventDefault(); e.stopPropagation();
                _navigate(1);
                break;
            case "Enter":
                e.preventDefault(); e.stopPropagation();
                _apply();
                break;
            case "KeyC": {
                const cur = _getItem(_index);
                const title = _titleFor(cur);
                if (!title) break;
                e.preventDefault(); e.stopPropagation();
                navigator.clipboard?.writeText?.(`@${title}`).catch(() => { });
                break;
            }
            case "KeyF":
                e.preventDefault(); e.stopPropagation();
                _toggleFavorite();
                break;
            case "Escape":
                e.preventDefault(); e.stopPropagation();
                close();
                break;
        }
    }

    function open({ list, startIndex = 0, onApply, onToggleFavorite, onSetFavoriteCategory, isFavorited, getFavoriteCategory, getFavoriteCategoryOptions, getImageUrl, getTitle } = {}) {
        _build();
        if (!Array.isArray(list) || list.length === 0) return;

        _list = list;
        _index = _normalizeIndex(startIndex, _list.length);
        _onApply = onApply ?? null;
        _onToggleFavorite = onToggleFavorite ?? null;
        _onSetFavoriteCategory = onSetFavoriteCategory ?? null;
        _isFavorited = isFavorited ?? null;
        _getFavoriteCategory = getFavoriteCategory ?? null;
        _getFavoriteCategoryOptions = getFavoriteCategoryOptions ?? null;
        _getImageUrl = getImageUrl ?? null;
        _getTitle = getTitle ?? null;
        _pendingFavoriteCategory = "";
        _favoriteCategoryTarget = null;
        _preloaded.clear();
        _preloadedAheadIndex = _index - 1;
        _preloadedBehindIndex = _index + 1;

        _previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        el.classList.remove("hidden");
        _update();
        _preloadAhead();
        _preloadBehind();

        if (!_keyHandler) {
            _keyHandler = (e) => _onKey(e);
            document.addEventListener("keydown", _keyHandler, true);
        }
    }

    function close() {
        el?.classList.add("hidden");
        _list = [];
        _onApply = null;
        _onToggleFavorite = null;
        _onSetFavoriteCategory = null;
        _isFavorited = null;
        _getFavoriteCategory = null;
        _getFavoriteCategoryOptions = null;
        _pendingFavoriteCategory = "";
        _favoriteCategoryTarget = null;
        _getImageUrl = null;
        _getTitle = null;
        _preloaded.clear();
        _preloadedAheadIndex = -1;
        _preloadedBehindIndex = -1;
        document.body.style.overflow = _previousBodyOverflow;

        if (_keyHandler) {
            document.removeEventListener("keydown", _keyHandler, true);
            _keyHandler = null;
        }
    }

    return { open, close };
})();
