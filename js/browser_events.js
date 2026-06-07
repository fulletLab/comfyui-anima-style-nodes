import { createUploadPicker } from "./browser_upload_picker.js";

export function attachBrowserEvents({
    el,
    api,
    localHeaders,
    ensureLocalToken,
    refreshAuthStatus,
    getAuthPollTimer,
    setAuthPollTimer,
    setRemoteFavoritesLoaded,
    clearRemoteFavorites,
    rebuildFavoriteMap,
    getCategory,
    renderFavorites,
    getActiveNode,
    getPromptWidget,
    render,
    setFulletLoaded,
    close,
    dataReset,
    setFilter,
    setSort,
    setCategory,
    setCategoryTabs,
    getVisibleTabs,
    setVisibleTabs,
    availableTabs,
    setObserver,
    openSwipeFromHighlighted,
    loadLocalFavorites,
    isGeneratedGalleryEnabled,
}) {
    const onlineToggle = el.querySelector("#anima-online-toggle");
    if (localStorage.getItem("anima_remote_images_opt_in_v1") === null) {
        localStorage.setItem("anima_online", "false");
        localStorage.setItem("anima_remote_images_opt_in_v1", "seen");
    }
    if (localStorage.getItem("anima_online") === null) {
        localStorage.setItem("anima_online", "false");
    }
    onlineToggle.checked = localStorage.getItem("anima_online") === "true";
    onlineToggle.addEventListener("change", (e) => {
        localStorage.setItem("anima_online", e.target.checked);
        render({ preservePage: true });
    });

    const animadexToggle = el.querySelector("#anima-animadex-source");
    if (localStorage.getItem("anima_animadex_enabled") === null) {
        localStorage.setItem("anima_animadex_enabled", "false");
    }
    if (animadexToggle) {
        animadexToggle.checked = localStorage.getItem("anima_animadex_enabled") === "true";
        animadexToggle.addEventListener("change", (e) => {
            localStorage.setItem("anima_animadex_enabled", e.target.checked ? "true" : "false");
            render();
        });
    }

    const updateStylesUrl = () => {
        const category = getCategory?.();
        const includeAnimadex = localStorage.getItem("anima_animadex_enabled") === "true";
        if (category === "animadex-styles") return "/anima/update?animadex=1&animadex_modes=artists";
        if (category === "animadex-characters") return "/anima/update?animadex=1&animadex_modes=characters";
        return includeAnimadex ? "/anima/update?animadex=1" : "/anima/update";
    };

    const syncVisibleTabInputs = () => {
        const visible = new Set(getVisibleTabs?.() || []);
        el.querySelectorAll("[data-tab-toggle]").forEach((input) => {
            input.checked = visible.has(input.dataset.tabToggle);
        });
    };

    const collectVisibleTabInputs = () => {
        const selected = [];
        el.querySelectorAll("[data-tab-toggle]").forEach((input) => {
            if (input.checked) selected.push(input.dataset.tabToggle);
        });
        return selected.length ? selected : [availableTabs?.[0] || "all"];
    };

    syncVisibleTabInputs();
    el.querySelectorAll("[data-tab-toggle]").forEach((input) => {
        input.addEventListener("change", async () => {
            await setVisibleTabs?.(collectVisibleTabInputs());
            syncVisibleTabInputs();
        });
    });

    const keyModal = el.querySelector("#anima-key-modal");
    const keyPanel = el.querySelector("#anima-key-panel");
    const keyInput = el.querySelector("#anima-key-input");
    const keyClose = el.querySelector("#anima-key-close");
    const keySave = el.querySelector("#anima-key-save");

    const ensureHeadersReady = async () => {
        const ok = await ensureLocalToken();
        if (!ok) {
            throw new Error("Local security token not available. Reopen the browser and try again.");
        }
        return localHeaders();
    };

    const syncSessionMode = async (persistent) => {
        const headers = await ensureHeadersReady();
        await api.fetchApi("/anima/fullet_session_mode", {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ persistent: !!persistent }),
        });
    };

    const disconnectLocalSession = async () => {
        const headers = await ensureHeadersReady();
        await api.fetchApi("/anima/fullet_disconnect", { method: "POST", headers });
        clearRemoteFavorites();
        setRemoteFavoritesLoaded(false);
        rebuildFavoriteMap();
    };

    const saveApiKey = async () => {
        const headers = await ensureHeadersReady();
        const apiKey = String(keyInput?.value || "").trim();
        if (!apiKey) {
            alert("Paste a Personal API Key first.");
            return false;
        }

        const response = await api.fetchApi("/anima/fullet_api_key", {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                apiKey,
                persistent: true,
            }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload?.error || `Could not save API key (${response.status})`);
        }
        keyInput.value = "";
        keyModal?.classList.add("hidden");
        setRemoteFavoritesLoaded(false);
        await refreshAuthStatus();
        if (getCategory() === "favorites") await renderFavorites();
        return true;
    };

    const openKeyModal = () => {
        keyModal?.classList.remove("hidden");
        setTimeout(() => keyInput?.focus(), 30);
    };

    const closeKeyModal = () => {
        keyModal?.classList.add("hidden");
        if (keyInput) keyInput.value = "";
    };

    const uploadPicker = createUploadPicker({
        root: el,
        api,
        localHeaders,
        ensureLocalToken,
        refreshAuthStatus,
    });

    const closeBrowser = () => {
        uploadPicker.close();
        closeKeyModal();
        close();
    };

    el.querySelector("#anima-fullet-connect").addEventListener("click", async () => {
        try {
            await syncSessionMode(true);
            openKeyModal();
        } catch (err) {
            alert(err?.message || "Could not open API key modal.");
        }
    });

    keyClose?.addEventListener("click", closeKeyModal);
    keyModal?.addEventListener("click", (event) => {
        if (event.target === keyModal) closeKeyModal();
    });
    keyPanel?.addEventListener("click", (event) => event.stopPropagation());
    keySave?.addEventListener("click", async () => {
        try {
            await saveApiKey();
        } catch (err) {
            alert(err?.message || "Could not save API key.");
        }
    });

    el.querySelector("#anima-fullet-disconnect").addEventListener("click", async () => {
        uploadPicker.close();
        closeKeyModal();
        try {
            await disconnectLocalSession();
        } catch (err) {
            alert(err?.message || "Could not remove API key.");
        }
        await refreshAuthStatus({ syncPending: false });
        if (getCategory() === "favorites") await renderFavorites();
    });

    const uploadBtn = el.querySelector("#anima-fullet-upload");
    uploadBtn.addEventListener("click", async () => {
        if (uploadBtn.classList.contains("disabled")) {
            alert("Set your Fullet API key first.");
            return;
        }

        try {
            await ensureHeadersReady();
            await uploadPicker.open();
        } catch (err) {
            alert(err?.message || "Could not open upload picker.");
        }
    });

    const dlBtn = el.querySelector("#anima-dl-images");
    dlBtn.addEventListener("click", async () => {
        if (dlBtn.classList.contains("disabled")) return;
        const ok = confirm(
            "This will download preview images for up to 20,000 styles.\n\n"
            + "It can take a long time and may use hundreds of MB.\n\n"
            + "Continue?"
        );
        if (!ok) return;

        try {
            const r = await api.fetchApi("/anima/download_images", { method: "POST", headers: localHeaders() });
            const res = await r.json();
            if (res.success) {
                const pollDownload = async () => {
                    dlBtn.classList.add("disabled");
                    const statusResponse = await api.fetchApi("/anima/download_status");
                    const s = await statusResponse.json();
                    if (s.active) {
                        dlBtn.textContent = `Downloading ${s.done}/${s.total}...`;
                        setTimeout(pollDownload, 1000);
                    } else {
                        dlBtn.textContent = "Download Complete!";
                        dlBtn.classList.remove("disabled");
                        setTimeout(() => { dlBtn.textContent = "Download Previews"; }, 3000);
                        render();
                    }
                };
                pollDownload();
            } else {
                alert("Download already in progress or failed to start.");
            }
        } catch { }
    });

    el.querySelector(".backdrop").addEventListener("click", closeBrowser);
    el.querySelector(".hdr-close").addEventListener("click", closeBrowser);
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (uploadPicker.isOpen()) {
            uploadPicker.close();
            return;
        }
        if (keyModal && !keyModal.classList.contains("hidden")) {
            closeKeyModal();
            return;
        }
        closeBrowser();
    });

    el.querySelector("#anima-refresh").addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const oldHtml = btn.innerHTML;
        const renderInPlace = () => render({ preservePage: true });
        btn.innerHTML = `<div class="anima-spinner" style="width:14px;height:14px;border-width:2px"></div>`;
        btn.style.pointerEvents = "none";
        try {
            if (getCategory() === "fullet") {
                setFulletLoaded(false);
                await api.fetchApi("/anima/fullet_prompts?limit=1&offset=0&force=1");
                await renderInPlace();
            } else if (getCategory() === "generated") {
                if (typeof isGeneratedGalleryEnabled === "function" && !isGeneratedGalleryEnabled()) {
                    await renderInPlace();
                    return;
                }
                await renderInPlace();
            } else {
                const resp = await api.fetchApi(updateStylesUrl(), { method: "POST", headers: localHeaders() });
                const res = await resp.json();
                if (res.success) {
                    dataReset();
                    setFulletLoaded(false);
                    await renderInPlace();
                }
            }
        } catch { }
        btn.innerHTML = oldHtml;
        btn.style.pointerEvents = "auto";
    });

    let searchTo;
    el.querySelector(".cycle-search input").addEventListener("input", (e) => {
        clearTimeout(searchTo);
        searchTo = setTimeout(() => {
            setFilter(e.target.value.replace(/^@/, ""));
            render();
        }, 150);
    });

    const updateBtn = el.querySelector("#anima-update-styles");
    updateBtn.addEventListener("click", async () => {
        if (updateBtn.classList.contains("disabled")) return;
        const category = getCategory?.();
        const indexingAnimadex = localStorage.getItem("anima_animadex_enabled") === "true"
            || category === "animadex-styles"
            || category === "animadex-characters";
        updateBtn.innerHTML = indexingAnimadex ? "Indexing..." : "Updating...";
        updateBtn.classList.add("disabled");
        try {
            const resp = await api.fetchApi(updateStylesUrl(), { method: "POST", headers: localHeaders() });
            const res = await resp.json();
            if (res.success) {
                dataReset();
                render();
                updateBtn.innerHTML = "Success!";
            } else {
                updateBtn.innerHTML = "Failed!";
            }
        } catch {
            updateBtn.innerHTML = "Error!";
        }
        setTimeout(() => {
            updateBtn.innerHTML = "Update Styles";
            updateBtn.classList.remove("disabled");
        }, 2000);
    });

    el.querySelector(".hdr-select").addEventListener("change", (e) => {
        setSort(e.target.value);
        render();
    });

    el.querySelector("#anima-cat-all").addEventListener("click", () => {
        setCategory("all");
        setCategoryTabs();
        render();
    });

    el.querySelector("#anima-cat-animadex-styles").addEventListener("click", () => {
        setCategory("animadex-styles");
        setCategoryTabs();
        render();
    });

    el.querySelector("#anima-cat-animadex-characters").addEventListener("click", () => {
        setCategory("animadex-characters");
        setCategoryTabs();
        render();
    });

    el.querySelector("#anima-cat-generated").addEventListener("click", async () => {
        setCategory("generated");
        setCategoryTabs();
        await render();
    });

    el.querySelector("#anima-cat-fullet").addEventListener("click", async () => {
        setCategory("fullet");
        setCategoryTabs();
        await render();
    });

    el.querySelector("#anima-cat-favorites").addEventListener("click", async () => {
        setCategory("favorites");
        setCategoryTabs();
        await render();
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target._mount?.();
            else entry.target._unmount?.();
        });
    }, { root: el.querySelector(".body"), rootMargin: "400px" });
    setObserver(observer);

    setCategoryTabs();
    (async () => {
        await loadLocalFavorites();
    })();
}
