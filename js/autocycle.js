import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { Data } from "./data.js";
import { normalizeGeneratedTag } from "./browser_generated.js";
import { applyCharacterGroup, applyStyle, applyStyleGroup } from "./utils.js";

const CONFIG_KEY = "anima_autocycle_config_v1";
const STATE_KEY = "anima_autocycle_state_v1";
const UNLIMITED_BATCH_COUNT = -1;
const DEFAULT_CONFIG = {
    source: "styles",
    characterMode: "trigger",
    artistCount: 1,
    characterCount: 1,
    subject: "keep",
    repeats: 1,
    random: "uniform",
    pickMode: "random",
    recordBasis: "cycle",
    batchCount: 20,
    worksMin: "",
    worksMax: "",
};

const SUBJECT_OPTIONS = new Set(["keep", "1girl", "1boy", "2girls", "2boys", "1girl, 1boy"]);

function cycleBtn() {
    return document.getElementById("anima-cycle-btn");
}

function cycleStatus() {
    return document.getElementById("anima-cycle-status");
}

function readStoredConfig() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    } catch {
        return {};
    }
}

function readStoredState() {
    try {
        const state = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
        return {
            count: Math.max(0, Number.parseInt(state.count, 10) || 0),
            usedKeys: Array.isArray(state.usedKeys) ? state.usedKeys.filter(Boolean).map(String) : [],
        };
    } catch {
        return { count: 0, usedKeys: [] };
    }
}

function saveStoredState({ count = 0, usedKeys = [] } = {}) {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify({
            count: Math.max(0, Number.parseInt(count, 10) || 0),
            usedKeys: Array.from(new Set(usedKeys.map(String).filter(Boolean))),
        }));
    } catch { }
}

function normalizeConfig(raw = {}) {
    const source = ["styles", "characters", "all"].includes(raw.source) ? raw.source : DEFAULT_CONFIG.source;
    const characterMode = raw.characterMode === "trigger-tags" ? "trigger-tags" : DEFAULT_CONFIG.characterMode;
    const random = raw.random === "weighted" ? "weighted" : DEFAULT_CONFIG.random;
    const pickMode = raw.pickMode === "order" ? "order" : DEFAULT_CONFIG.pickMode;
    const recordBasis = raw.recordBasis === "generated" ? "generated" : DEFAULT_CONFIG.recordBasis;
    const artistCount = Math.max(1, Math.min(6, Number.parseInt(raw.artistCount, 10) || DEFAULT_CONFIG.artistCount));
    const characterCount = Math.max(1, Math.min(6, Number.parseInt(raw.characterCount, 10) || DEFAULT_CONFIG.characterCount));
    const rawBatchCount = Number.parseInt(raw.batchCount, 10);
    const batchCount = rawBatchCount === UNLIMITED_BATCH_COUNT
        ? UNLIMITED_BATCH_COUNT
        : Math.max(1, Number.isFinite(rawBatchCount) ? rawBatchCount : DEFAULT_CONFIG.batchCount);
    const worksMinValue = Number.parseInt(raw.worksMin, 10);
    const worksMaxValue = Number.parseInt(raw.worksMax, 10);
    const worksMin = Number.isFinite(worksMinValue) && worksMinValue >= 0 ? worksMinValue : "";
    const worksMax = Number.isFinite(worksMaxValue) && worksMaxValue >= 0 ? worksMaxValue : "";
    const subject = SUBJECT_OPTIONS.has(String(raw.subject || "").trim().toLowerCase())
        ? String(raw.subject || "").trim().toLowerCase()
        : DEFAULT_CONFIG.subject;
    const repeats = Math.max(1, Math.min(24, Number.parseInt(raw.repeats, 10) || DEFAULT_CONFIG.repeats));
    return {
        source,
        characterMode,
        artistCount,
        characterCount,
        subject,
        repeats,
        random,
        pickMode,
        recordBasis,
        batchCount,
        worksMin,
        worksMax,
    };
}

function getConfig() {
    return normalizeConfig(readStoredConfig());
}

function saveConfig(next) {
    const config = normalizeConfig(next);
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch { }
    return config;
}

function isCharacter(item) {
    return String(item?.source_kind || "").toLowerCase() === "character";
}

function itemKind(item) {
    return isCharacter(item) ? "character" : "style";
}

function itemKey(item) {
    const raw = String(item?.tag || "").trim();
    const key = isCharacter(item) ? raw.toLowerCase() : normalizeGeneratedTag(raw);
    return `${itemKind(item)}:${key}`;
}

function selectionKey(items = []) {
    return (Array.isArray(items) ? items : [])
        .map(itemKey)
        .filter(Boolean)
        .join("|");
}

function itemLabel(item) {
    const tag = String(item?.trigger || item?.tag || "").replace(/^@+/, "").replace(/_/g, " ").trim();
    return isCharacter(item) ? tag : `@${tag}`;
}

function selectionLabel(items = []) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) return "";
    if (list.length === 1) return itemLabel(list[0]);
    return list.map(itemLabel).join(" + ");
}

function itemWeight(item) {
    const raw = Number(
        item?.works
        || item?.image_count
        || item?.images
        || item?.count
        || item?.total
        || 1
    );
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function itemWorks(item) {
    const raw = Number(
        item?.works
        || item?.image_count
        || item?.images
        || item?.count
        || item?.total
        || 0
    );
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function matchesSource(item, config) {
    if (!item) return false;
    const works = itemWorks(item);
    if (config.worksMin !== "" && works < Number(config.worksMin)) return false;
    if (config.worksMax !== "" && works > Number(config.worksMax)) return false;
    if (config.source === "all") return true;
    if (config.source === "characters") return isCharacter(item);
    return !isCharacter(item);
}

function sourceLabel(config) {
    if (config.source === "characters") return "Characters";
    if (config.source === "all") return "Styles + Characters";
    return "Styles";
}

function compactCycleStatus(text) {
    const value = String(text || "").trim();
    const generatedMatch = value.match(/^(\d+)\s+records\s+-\s+generated gallery$/i);
    if (generatedMatch) return `${compactCount(generatedMatch[1])} gen`;
    return value
        .replace(/^(\d+)\s+records\s+-\s+/i, (_, count) => `${compactCount(count)} - `)
        .replace(/\bgenerated gallery\b/ig, "generated")
        .replace(/\bAuto Cycle\b/g, "Cycle");
}

function compactCount(value) {
    const count = Number.parseInt(value, 10);
    if (!Number.isFinite(count)) return String(value || "");
    if (count >= 1000000) return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1).replace(/\.0$/, "")}m`;
    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 1 : 0).replace(/\.0$/, "")}k`;
    return String(count);
}

function setCycleStatus(text, active = false) {
    const status = cycleStatus();
    if (!status) return;
    const fullText = String(text || "");
    status.textContent = compactCycleStatus(fullText);
    status.title = fullText;
    status.classList.toggle("active", active);
}

function pickRandom(pool, config = DEFAULT_CONFIG) {
    if (!pool.length) return null;
    const mode = config?.random === "weighted" ? "weighted" : DEFAULT_CONFIG.random;
    if (mode !== "weighted") {
        return pool[Math.floor(Math.random() * pool.length)];
    }

    const total = pool.reduce((sum, item) => sum + itemWeight(item), 0);
    let roll = Math.random() * total;
    for (const item of pool) {
        roll -= itemWeight(item);
        if (roll <= 0) return item;
    }
    return pool[pool.length - 1];
}

export const AutoCycle = (() => {
    let _running = false;
    let _handler = null;
    let _node = null;
    let _count = 0;
    let _currentItem = null;
    let _currentItems = [];
    let _currentKey = "";
    let _currentStyleParts = [];
    let _currentCharacterParts = [];
    let _itemRuns = 0;
    let _manualNext = null;
    let _knownCharactersPromise = null;
    let _usedKeys = new Set();
    let _generatedKeysPromise = null;
    let _syncGeneratedPreviews = null;
    let _syncingGeneratedPreviews = false;
    let _stoppedGeneratedSyncHandler = null;
    let _stoppedGeneratedSyncTimer = null;
    let _generatedRecordCount = 0;
    let _startupProgressChecked = false;

    function _clearState({ keepCount = false, keepInsertedParts = false } = {}) {
        _currentItem = null;
        _currentItems = [];
        _currentKey = "";
        if (!keepInsertedParts) {
            _currentStyleParts = [];
            _currentCharacterParts = [];
        }
        _itemRuns = 0;
        _manualNext = null;
        if (!keepCount) _count = 0;
        if (!keepCount) _usedKeys = new Set();
    }

    function _loadStoredProgress() {
        const state = readStoredState();
        _count = state.count;
        _usedKeys = new Set(state.usedKeys);
    }

    function _clearCycleProgressOnStartup(config = getConfig()) {
        if (_startupProgressChecked) return;
        _startupProgressChecked = true;
        if (config.recordBasis === "generated") return;
        _clearState({ keepInsertedParts: true });
        saveStoredState({ count: 0, usedKeys: [] });
    }

    function _clearStoredProgress() {
        _clearState({ keepInsertedParts: true });
        saveStoredState({ count: 0, usedKeys: [] });
        setCycleStatus("records cleared", false);
    }

    async function _loadPool(config) {
        const seen = new Set();
        const result = [];
        const add = (items = []) => {
            for (const item of items) {
                if (!item?.tag || !matchesSource(item, config)) continue;
                const key = itemKey(item);
                if (seen.has(key)) continue;
                seen.add(key);
                result.push(item);
            }
        };

        if (config.source === "styles" || config.source === "all") {
            add(await Data.all({ includeAnimadex: config.source === "all" }));
        }

        if (config.source === "characters" || config.source === "all") {
            let characters = [];
            try {
                characters = await Data.animadex("character");
            } catch { }
            add(characters);
            if (!characters.length) {
                add(await Data.all({ includeAnimadex: true }));
            }
        }

        return result;
    }

    async function _loadGeneratedStyleKeys({ force = false } = {}) {
        if (_generatedKeysPromise && !force) return _generatedKeysPromise;
        _generatedKeysPromise = (async () => {
            try {
                const response = await api.fetchApi("/anima/generated_previews?existing=1");
                const data = await response.json().catch(() => ({}));
                const items = Array.isArray(data?.items) ? data.items : [];
                const keys = new Set(items.map((item) => {
                    const key = normalizeGeneratedTag(item?.artist || item?.tag);
                    return key ? `style:${key}` : "";
                }).filter(Boolean));
                _generatedRecordCount = keys.size;
                return keys;
            } catch {
                _generatedRecordCount = 0;
                return new Set();
            }
        })();
        return _generatedKeysPromise;
    }

    async function _setGeneratedRecordsStatus({ force = false } = {}) {
        const keys = await _loadGeneratedStyleKeys({ force });
        _generatedRecordCount = keys.size;
        return _generatedRecordCount;
    }

    function _recordCount(config) {
        return config.recordBasis === "generated" ? _generatedRecordCount : _count;
    }

    async function _refreshGeneratedBasis(config) {
        if (config.recordBasis !== "generated" || typeof _syncGeneratedPreviews !== "function") return;
        if (_syncingGeneratedPreviews) return;
        _syncingGeneratedPreviews = true;
        try {
            await _syncGeneratedPreviews({ scanOutput: false });
            _generatedKeysPromise = null;
            await _setGeneratedRecordsStatus({ force: true });
        } catch (error) {
            console.warn("[AnimaStyleExplorer] Could not refresh generated gallery before Auto Cycle pick", error);
        } finally {
            _syncingGeneratedPreviews = false;
        }
    }

    function _cancelStoppedGeneratedSync() {
        if (_stoppedGeneratedSyncHandler) {
            api.removeEventListener("status", _stoppedGeneratedSyncHandler);
            _stoppedGeneratedSyncHandler = null;
        }
        if (_stoppedGeneratedSyncTimer) {
            clearTimeout(_stoppedGeneratedSyncTimer);
            _stoppedGeneratedSyncTimer = null;
        }
    }

    function _scheduleStoppedGeneratedSync() {
        if (typeof _syncGeneratedPreviews !== "function") return;
        _cancelStoppedGeneratedSync();

        const runSync = () => {
            _cancelStoppedGeneratedSync();
            _stoppedGeneratedSyncTimer = setTimeout(async () => {
                _stoppedGeneratedSyncTimer = null;
                try {
                    setCycleStatus("stopped - syncing final generated image", false);
                    await _syncGeneratedPreviews({ scanOutput: true });
                    _generatedKeysPromise = null;
                    await _setGeneratedRecordsStatus({ force: true });
                    setCycleStatus(`stopped after ${_recordCount(getConfig())}`, false);
                } catch (error) {
                    console.warn("[AnimaStyleExplorer] Could not sync final generated image after Auto Cycle stopped", error);
                }
            }, 450);
        };

        const queueRemaining = Number(app?.ui?.lastQueueSize ?? 0);
        if (queueRemaining <= 0) {
            runSync();
            return;
        }

        _stoppedGeneratedSyncHandler = (event) => {
            const remaining = Number(event?.detail?.exec_info?.queue_remaining ?? app?.ui?.lastQueueSize ?? 0);
            if (remaining <= 0) runSync();
        };
        api.addEventListener("status", _stoppedGeneratedSyncHandler);
    }

    async function _knownCharacters() {
        if (!_knownCharactersPromise) {
            _knownCharactersPromise = Data.animadex("character").catch(() => []);
        }
        return _knownCharactersPromise;
    }

    function _selectionMatchesConfig(items = [], config) {
        const list = Array.isArray(items) ? items.filter(Boolean) : [];
        if (!list.length) return false;
        if (!list.every((item) => matchesSource(item, config))) return false;
        const styleItems = list.filter((item) => !isCharacter(item));
        const characterItems = list.filter((item) => isCharacter(item));
        if (styleItems.length && styleItems.length !== config.artistCount) return false;
        if (characterItems.length && characterItems.length !== config.characterCount) return false;
        return true;
    }

    async function _styleGroupFromSeed(seed, config, sourceList = null, excludeKeys = []) {
        if (!seed || isCharacter(seed)) return seed ? [seed] : [];
        const count = Math.max(1, config.artistCount);
        const selected = [seed];
        if (count <= 1) return selected;

        const source = Array.isArray(sourceList) ? sourceList : await _loadPool(config);
        const selectedKeys = new Set([itemKey(seed), ...excludeKeys]);
        while (selected.length < count) {
            let pool = source.filter((item) => (
                item
                && !isCharacter(item)
                && matchesSource(item, config)
                && !selectedKeys.has(itemKey(item))
            ));
            if (!pool.length) {
                if (config.recordBasis === "generated") break;
                const currentSelection = new Set(selected.map(itemKey));
                pool = source.filter((item) => (
                    item
                    && !isCharacter(item)
                    && matchesSource(item, config)
                    && !currentSelection.has(itemKey(item))
                ));
            }
            if (!pool.length) break;
            const next = pickRandom(pool, config);
            if (!next) break;
            selected.push(next);
            selectedKeys.add(itemKey(next));
        }
        return selected;
    }

    async function _characterGroupFromSeed(seed, config, sourceList = null, excludeKeys = []) {
        if (!seed || !isCharacter(seed)) return seed ? [seed] : [];
        const count = Math.max(1, config.characterCount);
        const selected = [seed];
        if (count <= 1) return selected;

        const source = Array.isArray(sourceList) ? sourceList : await _loadPool(config);
        const selectedKeys = new Set([itemKey(seed), ...excludeKeys]);
        while (selected.length < count) {
            let pool = source.filter((item) => (
                item
                && isCharacter(item)
                && matchesSource(item, config)
                && !selectedKeys.has(itemKey(item))
            ));
            if (!pool.length) {
                const currentSelection = new Set(selected.map(itemKey));
                pool = source.filter((item) => (
                    item
                    && isCharacter(item)
                    && matchesSource(item, config)
                    && !currentSelection.has(itemKey(item))
                ));
            }
            if (!pool.length) break;
            const next = pickRandom(pool, config);
            if (!next) break;
            selected.push(next);
            selectedKeys.add(itemKey(next));
        }
        return selected;
    }

    async function _pickNextSelection(config, excludeKeys = []) {
        const list = await _loadPool(config);
        const excluded = new Set(excludeKeys);
        const generatedUsed = config.recordBasis === "generated"
            ? await _loadGeneratedStyleKeys({ force: true })
            : new Set();
        const used = new Set([
            ...(config.recordBasis === "generated" ? [] : _usedKeys),
            ...generatedUsed,
            ...excluded,
        ]);

        if (config.pickMode === "order" && config.source !== "characters") {
            const orderedTags = Array.from(document.querySelectorAll("#anima-browser .anima-card[data-tag]"))
                .map((card) => String(card.dataset.tag || "").trim().toLowerCase())
                .filter(Boolean);
            const byTag = new Map(list.map((item) => [String(item?.tag || "").trim().toLowerCase(), item]));
            const orderedStyles = orderedTags
                .map((tag) => byTag.get(tag))
                .filter((item) => item && !isCharacter(item) && matchesSource(item, config));
            const orderedCandidates = orderedStyles
                .filter((item) => !used.has(itemKey(item)));
            const orderedSeed = orderedCandidates[0] || list.find((item) => item && !isCharacter(item) && matchesSource(item, config) && !used.has(itemKey(item)));
            if (!orderedSeed) return [];
            return _styleGroupFromSeed(orderedSeed, config, list, [...used]);
        }

        if (config.source === "all") {
            const styles = list.filter((item) => item && !isCharacter(item));
            const characters = list.filter((item) => item && isCharacter(item));
            const stylePool = (config.recordBasis === "generated" || (used.size && styles.length > 1))
                ? styles.filter((item) => !used.has(itemKey(item)))
                : styles;
            const characterPool = used.size && characters.length > 1
                ? characters.filter((item) => !used.has(itemKey(item)))
                : characters;

            const styleSeed = pickRandom(stylePool.length ? stylePool : (config.recordBasis === "generated" ? [] : styles), config);
            const characterSeed = pickRandom(characterPool.length ? characterPool : characters, config);
            const styleGroup = await _styleGroupFromSeed(styleSeed, config, list, excludeKeys);
            const characterGroup = await _characterGroupFromSeed(characterSeed, config, list, excludeKeys);
            return [...styleGroup, ...characterGroup].filter(Boolean);
        }

        const pool = (config.recordBasis === "generated" || (used.size && list.length > 1))
            ? list.filter((item) => !used.has(itemKey(item)))
            : list;
        if (config.recordBasis === "generated" && !pool.length) return [];
        const first = pickRandom(pool.length ? pool : list, config);
        return isCharacter(first)
            ? _characterGroupFromSeed(first, config, list, excludeKeys)
            : _styleGroupFromSeed(first, config, list, excludeKeys);
    }

    async function _applySelection(items, config, modeOverride = "") {
        const selection = (Array.isArray(items) ? items : [items]).filter(Boolean);
        if (!selection.length) return { ok: false, error: "No Auto Cycle selection." };

        const first = selection[0];
        const styleItems = selection.filter((item) => !isCharacter(item));
        const characterItems = selection.filter((item) => isCharacter(item));
        const characterMode = characterItems.length
            ? (modeOverride === "trigger-tags" || modeOverride === "trigger" ? modeOverride : config.characterMode)
            : "";
        const knownCharacters = characterItems.length ? await _knownCharacters() : [];
        let styleResult = null;
        let characterResult = null;

        if (styleItems.length) {
            styleResult = applyStyleGroup(_node, styleItems, { replaceParts: _currentStyleParts });
            if (styleResult?.ok === false) return styleResult;
        }

        if (characterItems.length > 1) {
            characterResult = applyCharacterGroup(_node, characterItems, {
                mode: characterMode,
                replaceParts: _currentCharacterParts,
                subject: config.subject,
                knownCharacters,
            });
            if (characterResult?.ok === false) return characterResult;
        } else if (characterItems.length === 1) {
            characterResult = applyStyle(_node, characterItems[0], {
                mode: characterMode,
                replaceParts: _currentCharacterParts,
                subject: config.subject,
                knownCharacters,
            });
            if (characterResult?.ok === false) return characterResult;
        }

        const result = characterResult || styleResult;
        if (!result) return { ok: false, error: "No Auto Cycle selection could be applied." };

        _currentItem = first;
        _currentItems = [...styleItems, ...characterItems];
        _currentKey = selectionKey(_currentItems);
        if (styleItems.length) {
            _currentStyleParts = styleResult?.inserted || [];
        }
        if (characterItems.length) {
            _currentCharacterParts = characterResult?.inserted || [];
        }
        _itemRuns = 1;
        _count++;
        _currentItems.forEach((item) => _usedKeys.add(itemKey(item)));
        saveStoredState({ count: _count, usedKeys: [..._usedKeys] });

        if (config.recordBasis === "generated") {
            await _setGeneratedRecordsStatus({ force: true });
        }
        const repeatText = config.repeats > 1 ? ` (${_itemRuns}/${config.repeats})` : "";
        const kind = styleItems.length && characterItems.length
            ? `${styleItems.length} artist${styleItems.length === 1 ? "" : "s"} + ${characterItems.length} character${characterItems.length === 1 ? "" : "s"}`
            : styleItems.length > 1
                ? `${styleItems.length} artists`
                : characterItems.length > 1
                    ? `${characterItems.length} ${characterMode === "trigger-tags" ? "character tag sets" : "characters"}`
                    : isCharacter(first)
                        ? (characterMode === "trigger-tags" ? "character tags" : "character")
                        : "style";
        setCycleStatus(`${_recordCount(config)} records - ${kind} ${selectionLabel(_currentItems)}${repeatText}`, true);
        app.queuePrompt(0, 1);
        return result;
    }

    function _repeatCurrent(config) {
        if (!_currentItems.length) return false;
        _itemRuns++;
        _count++;
        saveStoredState({ count: _count, usedKeys: [..._usedKeys] });
        setCycleStatus(`${_recordCount(config)} records - ${selectionLabel(_currentItems)} (${_itemRuns}/${config.repeats})`, true);
        app.queuePrompt(0, 1);
        return true;
    }

    async function _next() {
        if (!_running || !_node) return;

        if (!app.graph || !app.graph._nodes.includes(_node)) {
            stop();
            return;
        }

        try {
            const config = getConfig();
            await _refreshGeneratedBasis(config);
            if (config.recordBasis === "generated") {
                await _setGeneratedRecordsStatus();
            }
            const records = _recordCount(config);
            if (config.batchCount !== UNLIMITED_BATCH_COUNT && records >= config.batchCount) {
                setCycleStatus(`batch complete - ${records}/${config.batchCount}`, false);
                stop();
                return;
            }
            if (_currentItems.length && !_selectionMatchesConfig(_currentItems, config)) {
                _clearState({ keepCount: true, keepInsertedParts: true });
            }

            let next = _manualNext;
            _manualNext = null;

            if (!next && _currentItems.length && _itemRuns < config.repeats) {
                _repeatCurrent(config);
                return;
            }

            if (next && !next.items?.every((item) => matchesSource(item, config))) {
                next = null;
            }

            const items = next?.items || await _pickNextSelection(config, _currentItems.map(itemKey));
            if (!items?.length) {
                setCycleStatus(`No ${sourceLabel(config).toLowerCase()} available for Auto Cycle`, false);
                stop();
                return;
            }

            await _applySelection(items, config, next?.mode || "");
        } catch (err) {
            console.warn("[AnimaStyleExplorer] Auto Cycle stopped", err);
            stop();
            setCycleStatus(`error - ${err?.message || "Auto Cycle stopped"}`, false);
        }
    }

    function start(node) {
        if (_running) return;
        _cancelStoppedGeneratedSync();
        const config = getConfig();
        _clearCycleProgressOnStartup(config);
        _loadStoredProgress();
        if (_currentItems.length && !_selectionMatchesConfig(_currentItems, config)) {
            _clearState({ keepCount: true, keepInsertedParts: true });
        }
        _running = true;
        _node = node;
        if (!_handler) {
            _handler = (e) => {
                if (!_running || !_node) return;
                if (e.detail?.exec_info?.queue_remaining === 0) _next();
            };
            api.addEventListener("status", _handler);
        }
        const btn = cycleBtn();
        if (btn) {
            btn.classList.add("running");
            btn.querySelector(".btn-icon").innerHTML = "&#9646;&#9646;";
            btn.querySelector(".btn-lbl").textContent = "Stop";
        }
        setCycleStatus("starting...", true);
        _next();
    }

    function stop() {
        if (!_running) return;
        _running = false;
        if (_handler) {
            api.removeEventListener("status", _handler);
            _handler = null;
        }
        const config = getConfig();
        const btn = cycleBtn();
        if (btn) {
            btn.classList.remove("running");
            btn.querySelector(".btn-icon").innerHTML = "&#9654;";
            btn.querySelector(".btn-lbl").textContent = "Play";
        }
        setCycleStatus(`stopped after ${_recordCount(config)}`, false);
        saveStoredState({ count: _count, usedKeys: [..._usedKeys] });
        _scheduleStoppedGeneratedSync();
    }

    function toggle(node) {
        _running ? stop() : start(node);
        return _running;
    }

    async function inject(node, item, options = {}) {
        _node = node;
        if (!_running) {
            const replaceParts = isCharacter(item) ? _currentCharacterParts : _currentStyleParts;
            const knownCharacters = isCharacter(item) ? await _knownCharacters() : [];
            const result = applyStyle(node, item, {
                mode: options?.mode,
                replaceParts,
                subject: getConfig().subject,
                styleAction: options?.styleAction,
                replaceIndex: options?.replaceIndex,
                knownCharacters,
            });
            if (result?.ok !== false) {
                if (isCharacter(item)) {
                    _currentCharacterParts = result?.inserted || [];
                } else {
                    _currentStyleParts = result?.inserted || [];
                }
            }
            return result;
        }

        const config = getConfig();
        if (!matchesSource(item, config)) {
            setCycleStatus(`Auto Cycle source is ${sourceLabel(config)}`, true);
            return false;
        }

        const mode = isCharacter(item)
            ? (options?.mode === "trigger-tags" || options?.mode === "trigger" ? options.mode : config.characterMode)
            : "";
        const items = isCharacter(item)
            ? await _characterGroupFromSeed(item, config, null, _currentItems.map(itemKey))
            : await _styleGroupFromSeed(item, config, null, _currentItems.map(itemKey));

        if ((app.ui.lastQueueSize || 0) === 0) {
            return await _applySelection(items, config, mode);
        }

        _manualNext = { items, mode };
        setCycleStatus(`Next - ${selectionLabel(items)}`, true);
        return { ok: true, queued: true };
    }

    function bindControls(root = document) {
        const host = root || document;
        if (host._animaCycleControlsBound) return;
        const stylesEnabledEl = host.querySelector?.("#anima-cycle-enable-styles");
        const charactersEnabledEl = host.querySelector?.("#anima-cycle-enable-characters");
        const modeEl = host.querySelector?.("#anima-cycle-character-mode");
        const artistsEl = host.querySelector?.("#anima-cycle-artists");
        const charactersEl = host.querySelector?.("#anima-cycle-characters");
        const subjectEl = host.querySelector?.("#anima-cycle-subject");
        const repeatsEl = host.querySelector?.("#anima-cycle-repeats");
        const pickModeEl = host.querySelector?.("#anima-cycle-pick-mode");
        const recordBasisEl = host.querySelector?.("#anima-cycle-record-basis");
        const batchCountEl = host.querySelector?.("#anima-cycle-batch-count");
        const worksMinEl = host.querySelector?.("#anima-cycle-works-min");
        const worksMaxEl = host.querySelector?.("#anima-cycle-works-max");
        const clearRecordsBtn = host.querySelector?.("#anima-cycle-clear-records");
        const settingsBtn = host.querySelector?.("#anima-cycle-settings");
        const settingsPanel = host.querySelector?.("#anima-cycle-settings-panel");
        const settingsClose = host.querySelector?.("#anima-cycle-settings-close");
        if (!stylesEnabledEl || !charactersEnabledEl || !modeEl || !artistsEl || !charactersEl || !subjectEl || !repeatsEl || !pickModeEl || !recordBasisEl || !batchCountEl || !worksMinEl || !worksMaxEl || !clearRecordsBtn) return;

        const config = getConfig();
        _clearCycleProgressOnStartup(config);
        if (config.recordBasis === "generated") {
            _setGeneratedRecordsStatus({ force: true })
                .then((count) => {
                    if (!_running) setCycleStatus(`${count} records - generated gallery`, false);
                })
                .catch(() => { });
        }
        stylesEnabledEl.checked = config.source === "styles" || config.source === "all";
        charactersEnabledEl.checked = config.source === "characters" || config.source === "all";
        modeEl.value = config.characterMode;
        artistsEl.value = String(config.artistCount);
        charactersEl.value = String(config.characterCount);
        subjectEl.value = config.subject;
        repeatsEl.value = String(config.repeats);
        pickModeEl.value = config.pickMode === "order" ? "order" : `random-${config.random}`;
        recordBasisEl.value = config.recordBasis;
        batchCountEl.value = String(config.batchCount);
        worksMinEl.value = config.worksMin === "" ? "" : String(config.worksMin);
        worksMaxEl.value = config.worksMax === "" ? "" : String(config.worksMax);

        const selectedSource = () => {
            if (!stylesEnabledEl.checked && !charactersEnabledEl.checked) {
                stylesEnabledEl.checked = true;
            }
            if (stylesEnabledEl.checked && charactersEnabledEl.checked) return "all";
            return charactersEnabledEl.checked ? "characters" : "styles";
        };

        const syncRotateState = () => {
            const stylesOn = stylesEnabledEl.checked;
            const charactersOn = charactersEnabledEl.checked;
            artistsEl.disabled = !stylesOn;
            artistsEl.closest?.(".cycle-stepper")?.querySelectorAll("button").forEach((button) => { button.disabled = !stylesOn; });
            artistsEl.closest?.(".cycle-control")?.classList.toggle("cycle-control-disabled", !stylesOn);
            charactersEl.disabled = !charactersOn;
            charactersEl.closest?.(".cycle-stepper")?.querySelectorAll("button").forEach((button) => { button.disabled = !charactersOn; });
            charactersEl.closest?.(".cycle-control")?.classList.toggle("cycle-control-disabled", !charactersOn);
            modeEl.disabled = !charactersOn;
            modeEl.closest?.(".cycle-control")?.classList.toggle("cycle-control-disabled", !charactersOn);
        };

        const pickModeConfig = () => {
            if (pickModeEl.value === "order") return { pickMode: "order", random: config.random };
            if (pickModeEl.value === "random-weighted") return { pickMode: "random", random: "weighted" };
            return { pickMode: "random", random: "uniform" };
        };
        syncRotateState();

        const closePanel = () => {
            settingsPanel?.classList.add("hidden");
            settingsBtn?.classList.remove("active");
        };
        settingsBtn?.addEventListener("click", (event) => {
            event.stopPropagation();
            const hidden = settingsPanel?.classList.contains("hidden");
            settingsPanel?.classList.toggle("hidden", !hidden);
            settingsBtn?.classList.toggle("active", !!hidden);
        });
        settingsClose?.addEventListener("click", (event) => {
            event.stopPropagation();
            closePanel();
        });
        settingsPanel?.addEventListener("click", (event) => event.stopPropagation());
        document.addEventListener("click", closePanel);

        host.querySelectorAll?.("[data-step-target]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const target = document.getElementById(button.dataset.stepTarget || "");
                if (!target) return;
                const min = Number.parseInt(target.min, 10);
                const max = Number.parseInt(target.max, 10);
                const step = Number.parseInt(target.step, 10) || 1;
                const delta = Number.parseInt(button.dataset.stepDelta, 10) || 0;
                const current = Number.parseInt(target.value, 10) || 0;
                const lower = Number.isFinite(min) ? min : current + delta * step;
                const upper = Number.isFinite(max) ? max : current + delta * step;
                const next = Math.max(lower, Math.min(upper, current + delta * step));
                target.value = String(next);
                target.dispatchEvent(new Event("input", { bubbles: true }));
                target.dispatchEvent(new Event("change", { bubbles: true }));
            });
        });

        const persist = () => {
            const previous = getConfig();
            const pick = pickModeConfig();
            const nextConfig = saveConfig({
                source: selectedSource(),
                characterMode: modeEl.value,
                artistCount: artistsEl.value,
                characterCount: charactersEl.value,
                subject: subjectEl.value,
                repeats: repeatsEl.value,
                random: pick.random,
                pickMode: pick.pickMode,
                recordBasis: recordBasisEl.value,
                batchCount: batchCountEl.value,
                worksMin: worksMinEl.value,
                worksMax: worksMaxEl.value,
            });
            if (previous.recordBasis === "generated" && nextConfig.recordBasis !== "generated") {
                _clearStoredProgress();
            } else if (nextConfig.recordBasis === "generated") {
                _setGeneratedRecordsStatus({ force: true })
                    .then((count) => {
                        if (!_running) setCycleStatus(`${count} records - generated gallery`, false);
                    })
                    .catch(() => { });
            }
        };

        [stylesEnabledEl, charactersEnabledEl, modeEl, artistsEl, charactersEl, subjectEl, repeatsEl, pickModeEl, recordBasisEl, batchCountEl, worksMinEl, worksMaxEl].forEach((control) => {
            control.addEventListener("change", persist);
            control.addEventListener("input", persist);
        });
        [stylesEnabledEl, charactersEnabledEl].forEach((control) => {
            control.addEventListener("change", syncRotateState);
            control.addEventListener("input", syncRotateState);
        });
        clearRecordsBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (getConfig().recordBasis === "generated") {
                _setGeneratedRecordsStatus({ force: true })
                    .then((count) => setCycleStatus(`${count} records - generated gallery`, false))
                    .catch(() => setCycleStatus("generated gallery records unavailable", false));
                return;
            }
            _clearStoredProgress();
        });
        host._animaCycleControlsBound = true;
    }

    function setGeneratedSyncHandler(handler) {
        _syncGeneratedPreviews = typeof handler === "function" ? handler : null;
    }

    return {
        toggle,
        stop,
        inject,
        bindControls,
        setGeneratedSyncHandler,
        getConfig,
        get running() { return _running; },
    };
})();
