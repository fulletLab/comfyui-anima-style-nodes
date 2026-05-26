export function injectCSS() {
    if (document.getElementById("anima-css")) return;
    const s = document.createElement("style");
    s.id = "anima-css";
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

#anima-browser { position:fixed; inset:0; z-index:99998; display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; }
#anima-browser.hidden { display:none; }
#anima-browser .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.8); backdrop-filter:blur(10px); }
#anima-browser .window { position:relative; z-index:1; width:min(98vw,1540px); height:min(95vh,980px); background:#0b0b0f; border:1px solid #2b3042; border-radius:14px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 40px 100px #000c, inset 0 1px 0 rgba(255,255,255,.04); }

#anima-browser .hdr { display:flex; align-items:center; gap:8px; padding:12px 14px; border-bottom:1px solid #252a3a; background:linear-gradient(180deg,#1b2033 0%,#111522 100%); flex-shrink:0; flex-wrap:wrap; box-shadow:inset 0 1px 0 rgba(255,255,255,.09), 0 8px 24px rgba(0,0,0,.16); }
#anima-browser .hdr-title { font-size:13px; font-weight:700; color:#eef2ff; letter-spacing:.02em; white-space:nowrap; text-shadow:0 0 12px rgba(145,170,255,.18); }
#anima-browser .hdr-tabs { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-left:8px; }
#anima-browser .hdr-pill { background:#141420; border:1px solid #1e1e30; color:#707090; font-size:9.5px; font-family:'JetBrains Mono',monospace; padding:2px 7px; border-radius:20px; }
#anima-browser .hdr-gap { flex:1; }
#anima-browser .search-wrap { position:relative; flex:1; max-width:300px; }
#anima-browser .search-icon { position:absolute; left:9px; top:50%; transform:translateY(-50%); color:#2e2e42; font-size:11px; pointer-events:none; font-style:normal; font-family:'JetBrains Mono',monospace; }
#anima-browser .search-input { width:100%; padding:7px 10px 7px 27px; background:#0f0f16; border:1px solid #1e1e2c; border-radius:7px; color:#a0a0bc; font-family:'JetBrains Mono',monospace; font-size:12px; outline:none; transition:border-color .15s; box-sizing:border-box; }
#anima-browser .search-input::placeholder { color:#26263a; }
#anima-browser .search-input:focus { border-color:#343450; }
#anima-browser .hdr-select { padding:6px 8px; background:#121625; border:1px solid #2b3552; border-radius:7px; color:#b2bee6; font-size:11px; cursor:pointer; outline:none; }
#anima-browser .hdr-btn { width:29px; height:29px; display:flex; align-items:center; justify-content:center; background:#0f0f16; border:1px solid #1e1e2c; border-radius:7px; color:#404058; cursor:pointer; font-size:13px; transition:all .12s; flex-shrink:0; }
#anima-browser .hdr-btn:hover { background:#1e1e2c; color:#fff; border-color:#4a4a6a; }
#anima-browser .hdr-close { width:29px; height:29px; display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid #28181a; border-radius:7px; color:#583040; cursor:pointer; font-size:13px; transition:all .12s; flex-shrink:0; }
#anima-browser .hdr-close:hover { background:#241010; border-color:#4a2020; color:#c05060; }
#anima-browser .hdr-btn-txt { background:#171b2f; border:1px solid #303956; color:#aab6df; font-family:'Inter',sans-serif; font-size:10px; font-weight:600; padding:6px 12px; border-radius:6px; cursor:pointer; transition:all .15s; margin-right:4px; box-shadow:inset 0 1px 0 rgba(255,255,255,.03); }
#anima-browser .hdr-btn-txt:hover { background:#202946; border-color:#536797; color:#eef3ff; }
#anima-browser .hdr-btn-txt.active { background:#263457; border-color:#7891cf; color:#ffffff; box-shadow:0 0 0 1px rgba(125,155,230,.24), inset 0 1px 0 rgba(255,255,255,.08); }
#anima-browser .hdr-btn-txt.disabled { opacity:0.5; pointer-events:none; }

#anima-browser .cycle-bar { display:flex; align-items:center; gap:8px; padding:8px 14px; border-bottom:1px solid #202436; background:#111420; flex-shrink:0; box-shadow:inset 0 1px 0 rgba(255,255,255,.035); flex-wrap:wrap; }
#anima-browser .cycle-label { font-size:10.5px; color:#c0c0d0; font-family:'JetBrains Mono',monospace; white-space:nowrap; }
.anima-play-btn { display:flex; align-items:center; gap:5px; padding:5px 14px; border-radius:6px; cursor:pointer; font-family:'Inter',sans-serif; font-size:11px; font-weight:600; border:1px solid #1e3020; background:#121a12; color:#70a070; transition:all .15s; white-space:nowrap; }
.anima-play-btn:hover { background:#162016; border-color:#2a4030; color:#90c090; }
.anima-play-btn.running { background:#1e1010; border-color:#4a2020; color:#a05060; }
.cycle-settings-wrap { position:relative; display:flex; align-items:center; }
.cycle-settings-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:7px; border:1px solid #27304a; background:#0e1220; color:#aab6df; cursor:pointer; font-size:13px; transition:all .12s; }
.cycle-settings-btn:hover, .cycle-settings-btn.active { background:#18213a; border-color:#52689c; color:#eef3ff; }
.cycle-settings-panel { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:min(860px, calc(100vw - 48px)); max-height:calc(100vh - 70px); overflow:auto; padding:22px; border-radius:16px; border:1px solid #3c4b70; background:linear-gradient(180deg,#111a2d,#090e1a); box-shadow:0 32px 82px rgba(0,0,0,.62), 0 0 0 9999px rgba(3,6,12,.6); z-index:90; }
.cycle-settings-panel.hidden { display:none; }
.cycle-settings-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; padding-bottom:15px; border-bottom:1px solid #202b43; }
.cycle-settings-head div { display:flex; flex-direction:column; gap:5px; }
.cycle-settings-head strong { color:#eef3ff; font-size:16px; letter-spacing:.01em; }
.cycle-settings-head span { color:#91a4d0; font-size:12px; line-height:1.4; }
.cycle-settings-head button { width:34px; height:34px; flex-shrink:0; border-radius:9px; border:1px solid #3a1f2a; background:#14101a; color:#b06a7c; cursor:pointer; }
.cycle-settings-head button:hover { background:#241018; border-color:#6a2b3d; color:#ffd4df; }
.cycle-settings-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px; }
.cycle-settings-grid .cycle-control, .cycle-settings-grid .cycle-check { width:100%; min-height:66px; box-sizing:border-box; justify-content:space-between; align-items:flex-start; padding:12px 13px; }
.cycle-settings-grid .cycle-control { display:grid; grid-template-columns:150px 1fr; grid-template-rows:auto auto; column-gap:14px; row-gap:5px; }
.cycle-settings-grid .cycle-control span { grid-column:1; grid-row:1; padding-top:6px; color:#d8e2ff; font-size:11.5px; }
.cycle-settings-grid .cycle-control select,
.cycle-settings-grid .cycle-control input { grid-column:2; grid-row:1; width:100%; max-width:none; min-height:34px; }
.cycle-settings-grid .cycle-control small { grid-column:1 / -1; grid-row:2; color:#8fa1c8; font-size:10px; line-height:1.35; }
.cycle-settings-grid .cycle-check { min-height:54px; align-items:center; justify-content:flex-start; }
.anima-swipe-btn { display:flex; align-items:center; gap:6px; padding:5px 12px; border-radius:6px; cursor:pointer; font-family:'Inter',sans-serif; font-size:11px; font-weight:600; border:1px solid #203040; background:#101820; color:#80a0c0; transition:all .15s; white-space:nowrap; }
.anima-swipe-btn:hover { background:#142030; border-color:#2a405a; color:#b0d0f0; }
.anima-cycle-status { font-size:10.5px; color:#a0a0bc; font-family:'JetBrains Mono',monospace; }
.anima-cycle-status.active { color:#a0c0a0; }
#anima-browser .cycle-control { display:inline-flex; align-items:center; gap:5px; min-height:28px; padding:3px 6px; border:1px solid #27304a; border-radius:7px; background:#0e1220; color:#8794ba; font-size:9.5px; font-weight:600; }
#anima-browser .cycle-control span, #anima-browser .cycle-check span { color:#9aa8cf; font-size:9.5px; white-space:nowrap; }
#anima-browser .cycle-control select, #anima-browser .cycle-control input { min-height:22px; border:0; background:#151b2e; color:#d4defd; border-radius:5px; font-size:10px; outline:none; padding:3px 6px; }
#anima-browser .cycle-control select { max-width:132px; }
#anima-browser .cycle-control-small input { width:42px; text-align:center; }
#anima-browser .cycle-check { display:inline-flex; align-items:center; gap:5px; min-height:28px; padding:3px 7px; border:1px solid #27304a; border-radius:7px; background:#0e1220; }
#anima-browser .cycle-check input { accent-color:#7891cf; }
#anima-browser .cycle-settings-grid .cycle-control select,
#anima-browser .cycle-settings-grid .cycle-control input { width:100%; max-width:none; min-height:34px; font-size:11px; }
#anima-browser .cycle-settings-grid .cycle-control-small input { width:100%; text-align:center; }
#anima-browser .cycle-settings-grid .cycle-stepper { grid-column:2; grid-row:1; display:grid; grid-template-columns:38px minmax(54px, 1fr) 38px; gap:7px; align-items:center; width:100%; }
#anima-browser .cycle-settings-grid .cycle-stepper button { width:38px; height:34px; border-radius:8px; border:1px solid #405682; background:#17213a; color:#e3ebff; font-size:17px; font-weight:800; line-height:1; cursor:pointer; box-shadow:inset 0 1px 0 rgba(255,255,255,.05); }
#anima-browser .cycle-settings-grid .cycle-stepper button:hover { background:#223258; border-color:#6f8bd0; color:#ffffff; }
#anima-browser .cycle-settings-grid .cycle-stepper input { grid-column:auto; grid-row:auto; width:100%; min-width:54px; height:34px; border:1px solid #303f62; background:#121a2e; color:#eef3ff; font-size:13px; font-weight:800; text-align:center; }
#anima-browser .cycle-gap { flex:1; }
#anima-browser .cycle-search { position:relative; width:220px; margin-left:4px; }
#anima-browser .cycle-search i { position:absolute; left:8px; top:50%; transform:translateY(-50%); color:#2e2e42; font-size:10px; font-family:'JetBrains Mono',monospace; font-style:normal; pointer-events:none; }
#anima-browser .cycle-search input { width:100%; padding:5px 8px 5px 22px; background:#0e1220; border:1px solid #27304a; border-radius:6px; color:#c1caea; font-size:11px; font-family:'JetBrains Mono',monospace; outline:none; transition:border-color .15s; }
#anima-browser .cycle-search input:focus { border-color:#343450; }
#anima-browser .cycle-hint { font-size:10px; color:#8080a0; font-family:'Inter',sans-serif; opacity:0.9; font-style:italic; }

#anima-browser .anima-prompt-panel { display:grid; grid-template-columns:132px 1fr; gap:10px; align-items:stretch; padding:10px 14px; border-bottom:1px solid #202436; background:#0e121e; flex-shrink:0; }
#anima-browser .anima-prompt-head { display:flex; flex-direction:column; justify-content:center; gap:5px; color:#e4ebff; font-size:11px; font-weight:700; }
#anima-browser .anima-prompt-head small { color:#8794ba; font-family:'JetBrains Mono',monospace; font-size:9.5px; font-weight:500; }
#anima-browser #anima-prompt-editor { width:100%; min-height:58px; max-height:112px; resize:vertical; border-radius:8px; border:1px solid #27304a; background:#090d16; color:#dfe8ff; outline:none; padding:9px 10px; font-family:'JetBrains Mono',monospace; font-size:11px; line-height:1.45; box-sizing:border-box; }
#anima-browser #anima-prompt-editor:focus { border-color:#52689c; }

#anima-browser .body { flex:1; overflow-y:auto; padding:14px; scrollbar-width:thin; scrollbar-color:#1c1c28 transparent; }
#anima-browser .body::-webkit-scrollbar { width:5px; }
#anima-browser .body::-webkit-scrollbar-thumb { background:#1c1c28; border-radius:3px; }

.anima-grid { }
.anima-chunk { display:grid; grid-template-columns:repeat(auto-fill,minmax(152px,1fr)); gap:9px; width:100%; contain:content; }
.anima-empty { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; gap:10px; padding:60px; color:#222230; font-size:12px; }
.anima-net-gate { color:#9aa3c7; text-align:center; }
.anima-net-gate strong { font-family:'JetBrains Mono',monospace; font-size:18px; letter-spacing:.08em; color:#dce6ff; }
.anima-net-gate span { max-width:420px; line-height:1.5; color:#9aa3c7; }
.anima-remote-notice { display:flex; align-items:center; gap:10px; margin:0 0 12px; padding:10px 12px; border:1px solid #2b3552; border-radius:8px; background:#10182a; color:#aebce2; font-size:11px; }
.anima-remote-notice strong { color:#dce6ff; white-space:nowrap; }
.anima-remote-notice span { color:#aebce2; line-height:1.35; }
.anima-remote-notice b { color:#dce6ff; }

.hdr-toggle-wrap { display:inline-flex; align-items:center; gap:10px; margin-right:6px; background:linear-gradient(180deg,#10182b,#0b1120); padding:5px 10px 5px 12px; border-radius:10px; border:1px solid #25314a; box-shadow:inset 0 1px 0 rgba(255,255,255,.03); }
.hdr-toggle-label { font-size:10.5px; font-weight:600; color:#d4defd; letter-spacing:.01em; background:transparent; padding:0; border:none; margin-right:0; white-space:nowrap; }
.hdr-toggle-hint { display:none; }
.hdr-switch { position:relative; display:inline-block; width:34px; height:20px; transition:transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275); flex-shrink:0; }
.hdr-switch input { opacity:0; width:0; height:0; }
.hdr-slider { position:absolute; cursor:pointer; inset:0; background-color:#12182b; transition:.2s; border-radius:999px; border:1px solid #33425f; }
.hdr-slider:before { position:absolute; content:''; height:12px; width:12px; left:3px; bottom:3px; background-color:#91a1c9; transition:.2s; border-radius:50%; }
.hdr-switch:hover { transform:scale(1.08); }
input:checked + .hdr-slider { background-color:#1b2640; border-color:#51689c; }
input:checked + .hdr-slider:before { transform:translateX(14px); background-color:#8cb5ff; box-shadow:0 0 10px #5f8cff88; }

.hdr-data-btns { display:flex; align-items:center; gap:8px; margin-left:10px; border-left:1px solid #30364a; padding-left:10px; }
.hdr-settings-wrap { position:relative; display:flex; align-items:center; }
.hdr-settings-wrap #anima-settings-gear { font-size:15px; color:#8f96be; }
.hdr-settings-wrap:hover #anima-settings-gear,
.hdr-settings-wrap:focus-within #anima-settings-gear { color:#c7d4ff; border-color:#4a5f92; background:#1a2038; }
.hdr-settings-menu {
    position:absolute;
    top:calc(100% + 6px);
    right:0;
    min-width:170px;
    padding:6px;
    border-radius:8px;
    border:1px solid #2b3552;
    background:#0f1324;
    box-shadow:0 14px 28px rgba(0,0,0,.45);
    display:flex;
    flex-direction:column;
    gap:6px;
    opacity:0;
    transform:translateY(-6px) scale(.98);
    pointer-events:none;
    transition:opacity .14s ease, transform .14s ease;
    z-index:40;
}
.hdr-settings-wrap:hover .hdr-settings-menu,
.hdr-settings-wrap:focus-within .hdr-settings-menu {
    opacity:1;
    transform:translateY(0) scale(1);
    pointer-events:auto;
}
.hdr-settings-item { width:100%; margin-right:0; text-align:left; }
.hdr-settings-option {
    display:flex;
    align-items:center;
    gap:8px;
    padding:6px 8px;
    border:1px solid #25304f;
    border-radius:6px;
    color:#b6c5ef;
    font-size:10px;
    font-family:'Inter',sans-serif;
    cursor:pointer;
    background:#121a30;
}
.hdr-settings-option:hover { background:#172241; border-color:#3c4f80; color:#d6e1ff; }
.hdr-settings-option input { width:13px; height:13px; accent-color:#6b8bff; }

.anima-spinner { width:24px; height:24px; border:2px solid #181824; border-top-color:#363650; border-radius:50%; animation:anima-spin .6s linear infinite; }
@keyframes anima-spin { to { transform:rotate(360deg); } }

.anima-card { border-radius:8px; overflow:hidden; background:#0e0e14; border:1px solid #191922; cursor:pointer; transition:transform .15s,border-color .15s,box-shadow .15s; }
.anima-card:hover { transform:translateY(-2px); border-color:#2e2e48; box-shadow:0 6px 20px #0009; }
.anima-card.selected { border-color:#384838; box-shadow:0 0 0 2px #202e20; }
.anima-card-img { position:relative; aspect-ratio:1; overflow:hidden; background:#0c0c12; }
.anima-card-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .25s; }
.anima-card-img-contain { background:#b8b8bc; }
.anima-card-img-contain img { object-fit:contain; }
.anima-card:hover .anima-card-img img { transform:scale(1.06); }
.anima-card:hover .anima-card-img-contain img { transform:scale(1.02); }
.anima-card-img.no-img { display:flex; align-items:center; justify-content:center; }
.anima-card-img.no-img::after { content:attr(data-init); font-family:'JetBrains Mono',monospace; font-size:26px; font-weight:700; color:#1c1c28; text-transform:uppercase; }
.anima-card-overlay { position:absolute; inset:0; background:rgba(0,0,0,.65); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; flex-wrap:nowrap; padding:10px; box-sizing:border-box; opacity:0; transition:opacity .18s; }
.anima-uniqueness-rank { position:absolute; top:8px; left:8px; min-width:44px; height:28px; padding:0 10px; border-radius:999px; background:rgba(0,0,0,.55); border:1px solid #2e2e48; color:#e0e0f0; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 30px #0009; z-index:2; }
.anima-card:hover .anima-card-overlay { opacity:1; }
.anima-card-pick { background:#101020; border:1px solid #282840; color:#aeb9e6; font-family:'Inter',sans-serif; font-weight:600; font-size:10.5px; padding:5px 11px; border-radius:6px; cursor:pointer; transition:all .12s; min-width:82px; }
.anima-card-pick:hover { background:#181830; border-color:#404060; color:#b0b0d0; }
.anima-card-fav { background:#161622; border:1px solid #343450; color:#9ea8cf; font-family:'Inter',sans-serif; font-weight:600; font-size:10px; padding:5px 10px; border-radius:6px; cursor:pointer; transition:all .12s; margin-left:0; min-width:82px; }
.anima-card-fav:hover { background:#1f2338; border-color:#4b5b94; color:#d8e1ff; }
.anima-card-trigger-tags { margin-left:0; border-color:#31515f; background:#0f1c24; color:#9bd7ef; }
.anima-card-trigger-tags:hover { background:#17303c; border-color:#4c8192; color:#dff8ff; }
.anima-card-action-menu { position:absolute; left:8px; right:8px; top:50%; transform:translateY(-50%); z-index:6; display:flex; flex-direction:column; gap:6px; padding:9px; border-radius:8px; border:1px solid #31515f; background:rgba(8,13,22,.96); box-shadow:0 16px 32px rgba(0,0,0,.45); }
.anima-card-action-title { color:#dff8ff; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.anima-card-action-text { color:#b8c8ff; font-size:9.5px; line-height:1.35; font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-action-row { display:flex; align-items:center; gap:6px; }
.anima-card-action-row button { flex:1; min-height:25px; border-radius:6px; border:1px solid #2e446f; background:#141c31; color:#d8e4ff; font-size:9.5px; font-weight:600; cursor:pointer; }
.anima-card-action-row button:hover { background:#1d2b4b; border-color:#5470ad; color:#fff; }
.anima-card-action-list { display:flex; flex-direction:column; gap:5px; max-height:104px; overflow:auto; padding-right:2px; }
.anima-card-action-list button { width:100%; min-height:24px; border-radius:6px; border:1px solid #263b63; background:#10182a; color:#c9d8ff; font-size:9px; font-weight:600; text-align:left; padding:4px 7px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-action-list button:hover { background:#1b2948; border-color:#4f6fac; color:#ffffff; }
.anima-style-apply-modal { position:absolute; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:18px; }
.anima-style-apply-backdrop { position:absolute; inset:0; background:rgba(3,6,12,.58); backdrop-filter:blur(5px); }
.anima-style-apply-panel { position:relative; width:min(420px, 100%); border-radius:12px; border:1px solid #2e3a5c; background:linear-gradient(180deg,#111827,#090d17); box-shadow:0 28px 70px rgba(0,0,0,.52); overflow:hidden; }
.anima-style-apply-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px 16px 12px; border-bottom:1px solid #1d263c; }
.anima-style-apply-head div { min-width:0; display:flex; flex-direction:column; gap:4px; }
.anima-style-apply-head strong { color:#eef3ff; font-size:13px; }
.anima-style-apply-head span { color:#9fb4e8; font-family:'JetBrains Mono',monospace; font-size:10.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-style-apply-close { width:28px; height:28px; flex-shrink:0; border-radius:7px; border:1px solid #3a1f2a; background:#14101a; color:#b06a7c; cursor:pointer; }
.anima-style-apply-close:hover { background:#241018; border-color:#6a2b3d; color:#ffd4df; }
.anima-style-apply-body { display:flex; flex-direction:column; gap:8px; padding:14px 16px 16px; }
.anima-style-apply-choice { width:100%; min-height:32px; border-radius:8px; border:1px solid #2d3f66; background:#111a2e; color:#dbe6ff; font-size:11px; font-weight:700; cursor:pointer; text-align:left; padding:7px 10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-style-apply-choice:hover { background:#1a2948; border-color:#5a78b8; color:#ffffff; }
.anima-style-apply-primary { border-color:#31515f; background:#0f1c24; color:#dff8ff; }
.anima-style-apply-list { display:flex; flex-direction:column; gap:7px; max-height:170px; overflow:auto; padding-right:3px; }
.anima-style-apply-empty { margin:2px 0 0; color:#8fa0c8; font-size:10.5px; line-height:1.45; }
.anima-card-meta { padding:6px 8px 8px; }
.anima-card-tag { display:block; font-size:10px; font-weight:500; font-family:'JetBrains Mono',monospace; color:#d0d0e0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-trigger { display:block; margin-top:2px; font-size:9px; color:#9bd7ef; font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-tags-preview { display:block; margin-top:2px; font-size:8.5px; color:#8191bb; font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-works { display:block; font-size:9px; color:#8080a8; font-family:'JetBrains Mono',monospace; margin-top:2px; }
.anima-card-source { display:inline-flex; align-items:center; margin-left:6px; padding:1px 5px; border-radius:999px; border:1px solid #2f4268; background:#10192b; color:#a9c2ff; font-size:8px; text-transform:uppercase; letter-spacing:.02em; vertical-align:middle; }
.anima-card-source-character { border-color:#31515f; background:#0f1c24; color:#9bd7ef; }
.anima-card-source-artist { border-color:#3a426a; background:#151a2f; color:#b8c8ff; }

#anima-browser .ftr { display:flex; align-items:center; gap:10px; padding:8px 14px; border-top:1px solid #13131a; flex-shrink:0; }
#anima-browser .ftr-count { font-size:10px; font-family:'JetBrains Mono',monospace; color:#9090b0; }
#anima-browser .ftr-gap { flex:1; }
#anima-browser .ftr-link { font-size:10px; font-family:'JetBrains Mono',monospace; color:#c0c0d0; text-decoration:none; transition:color .12s; }
#anima-browser .ftr-link:hover { color:#606080; }

#anima-ac { position:fixed; z-index:99999; background:#0d0d14; border:1px solid #1e1e2c; border-radius:8px; overflow:hidden; max-height:260px; overflow-y:auto; box-shadow:0 12px 36px #000a; font-family:'Inter',sans-serif; min-width:240px; scrollbar-width:thin; }
#anima-ac.hidden { display:none; }
.anima-ac-row { display:flex; align-items:center; gap:8px; padding:6px 10px; cursor:pointer; border-bottom:1px solid #12121a; transition:background .1s; }
.anima-ac-row:last-child { border-bottom:none; }
.anima-ac-row:hover,.anima-ac-row.on { background:#141422; }
.anima-ac-thumb { width:30px; height:30px; border-radius:4px; object-fit:cover; background:#14141e; flex-shrink:0; }
.anima-ac-tag { flex:1; font-size:11.5px; font-family:'JetBrains Mono',monospace; color:#8080a0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.anima-ac-kind { font-size:8px; font-family:'JetBrains Mono',monospace; border:1px solid #2f4268; border-radius:999px; padding:1px 5px; color:#a9c2ff; background:#10192b; }
.anima-ac-kind-character { border-color:#31515f; background:#0f1c24; color:#9bd7ef; }
.anima-ac-kind-artist { border-color:#3a426a; background:#151a2f; color:#b8c8ff; }
.anima-ac-works { font-size:9.5px; font-family:'JetBrains Mono',monospace; color:#222230; white-space:nowrap; }

#anima-badge { position:absolute; background:#10101a; border:1px solid #22223a; color:#606080; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:500; padding:3px 10px; border-radius:5px; pointer-events:none; white-space:nowrap; z-index:10001; display:none; }

#anima-swipe { position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; }
#anima-swipe.hidden { display:none; }
#anima-swipe .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.82); backdrop-filter:blur(12px); }
#anima-swipe .swipe-header { position:absolute; top:18px; left:0; width:100%; display:flex; align-items:center; justify-content:space-between; padding:0 20px; color:#e0e0f0; z-index:2; }
#anima-swipe .swipe-title { position:absolute; left:50%; transform:translateX(-50%); text-align:center; font-size:24px; font-weight:700; text-shadow:0 2px 8px rgba(0,0,0,.5); }
#anima-swipe .swipe-counter { font-size:12px; font-family:'JetBrains Mono',monospace; background:rgba(0,0,0,.4); padding:6px 12px; border-radius:999px; border:1px solid #2a2a40; color:#c0c0d0; user-select:none; }
#anima-swipe .swipe-close { width:38px; height:38px; border-radius:10px; background:rgba(0,0,0,.25); border:1px solid #2a2a40; color:#c0c0d0; cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center; transition:background .15s,color .15s,transform .15s; }
#anima-swipe .swipe-close:hover { background:rgba(0,0,0,.45); color:#fff; transform:scale(1.05); }
#anima-swipe .swipe-container { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; z-index:1; overflow:hidden; }
#anima-swipe .swipe-container.swipe-transition .swipe-image { transition:transform .3s ease, opacity .3s ease, filter .3s ease; }
#anima-swipe .swipe-image { max-height:85vh; max-width:85vw; object-fit:contain; border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.35); }
#anima-swipe .swipe-image--current { transform:scale(1); opacity:1; z-index:3; cursor:pointer; }
#anima-swipe .swipe-image--prev, #anima-swipe .swipe-image--next { position:absolute; opacity:.5; filter:blur(8px); z-index:2; cursor:pointer; }
#anima-swipe .swipe-image--prev { transform:scale(.8) translateX(-50vw); }
#anima-swipe .swipe-image--next { transform:scale(.8) translateX(50vw); }
#anima-swipe .swipe-hint { position:absolute; bottom:18px; z-index:2; font-size:12px; color:#9090b0; background:rgba(0,0,0,.35); padding:6px 12px; border-radius:999px; border:1px solid #1a1a24; font-family:'JetBrains Mono',monospace; user-select:none; }

.anima-fullet-auth { font-size:10px; font-family:'JetBrains Mono',monospace; color:#8a8aa8; margin-right:6px; }
.anima-fullet-auth.connected { color:#9fd29f; }
#anima-fullet-upload.disabled { opacity:0.5; pointer-events:none; }

.anima-fullet-card { border-radius:10px; overflow:hidden; background:#0e0f16; border:1px solid #1d1f2c; display:flex; flex-direction:column; min-height:280px; transition:transform .15s,border-color .15s,box-shadow .15s; }
.anima-fullet-card:hover { border-color:#334068; box-shadow:0 8px 24px #0009; transform:translateY(-2px); }
.anima-fullet-card { min-height:unset; }
.anima-fullet-img { aspect-ratio:1.2; background:#090b12; position:relative; overflow:hidden; }
.anima-fullet-img img { width:100%; height:100%; object-fit:cover; display:block; }
.anima-fullet-img.no-img { display:flex; align-items:center; justify-content:center; }
.anima-fullet-img.no-img::after { content:attr(data-init); font-family:'JetBrains Mono',monospace; font-size:24px; color:#24283a; }
.anima-fullet-meta { display:flex; flex-direction:column; gap:5px; padding:10px 10px 11px; }
.anima-fullet-artist { font-family:'JetBrains Mono',monospace; font-size:11px; color:#d8dcf8; }
.anima-fullet-user { font-family:'JetBrains Mono',monospace; font-size:10px; color:#8a92b8; }
.anima-fullet-prompt { display:none !important; }
.anima-fullet-actions { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.anima-fullet-actions:first-of-type { margin-top:auto; }
.anima-fullet-actions + .anima-fullet-actions { margin-top:6px; }
.anima-fullet-actions-main { margin-top:6px; }
.anima-fullet-actions-main .anima-card-pick { width:100%; }
.anima-fullet-actions-secondary { margin-top:2px; }
.anima-fullet-mini,
.anima-fullet-mini-link {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-height:26px;
    padding:4px 8px;
    border-radius:6px;
    text-decoration:none;
}
.anima-fullet-mini { background:#12162a; border:1px solid #2b3559; color:#a9b8f0; font-family:'JetBrains Mono',monospace; font-size:10px; cursor:pointer; transition:all .12s; }
.anima-fullet-mini:hover { background:#1a2240; border-color:#4a5ea0; color:#d4e0ff; }
.anima-fullet-mini-link { color:#a9b8f0; border:1px solid #2b3559; background:#12162a; font-family:'JetBrains Mono',monospace; font-size:10px; }
.anima-fullet-mini-link:hover { background:#1a2240; border-color:#4a5ea0; color:#d4e0ff; }

#anima-toast-host {
    position:fixed;
    right:18px;
    bottom:18px;
    z-index:100120;
    display:flex;
    flex-direction:column;
    gap:8px;
    pointer-events:none;
}
.anima-toast {
    min-width:200px;
    max-width:340px;
    padding:8px 11px;
    border-radius:8px;
    border:1px solid #2a324d;
    background:rgba(15, 20, 35, 0.96);
    color:#dbe5ff;
    font-size:11px;
    font-family:'Inter',sans-serif;
    box-shadow:0 10px 24px rgba(0,0,0,.45);
    opacity:0;
    transform:translateY(8px);
    transition:opacity .16s ease, transform .16s ease;
}
.anima-toast.show { opacity:1; transform:translateY(0); }
.anima-toast-success { border-color:#2f5b45; background:rgba(12,34,24,.96); color:#b9f5d0; }
.anima-toast-error { border-color:#6a2d3b; background:rgba(44,16,26,.96); color:#ffc9d5; }
.anima-inline-toast {
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%, -46%) scale(.92);
    min-width:128px;
    max-width:calc(100% - 18px);
    padding:10px 14px;
    border-radius:999px;
    border:1px solid #2d3f63;
    background:rgba(11, 16, 28, 0.9);
    color:#eef4ff;
    font-size:11px;
    font-family:'Inter',sans-serif;
    font-weight:600;
    letter-spacing:.01em;
    box-shadow:0 16px 34px rgba(0,0,0,.42);
    backdrop-filter:blur(8px);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    opacity:0;
    transition:opacity .16s ease, transform .16s ease;
    pointer-events:none;
    z-index:5;
}
.anima-inline-toast.show { opacity:1; transform:translate(-50%, -50%) scale(1); }
.anima-inline-toast-success { border-color:#2f5b45; background:rgba(11, 31, 22, 0.9); color:#c9f8d8; }
.anima-inline-toast-error { border-color:#6a2d3b; background:rgba(45, 18, 28, 0.92); color:#ffd4de; }
.anima-upload-modal {
    position:absolute;
    inset:0;
    z-index:30;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
    background:rgba(5, 8, 14, 0.78);
    backdrop-filter:blur(8px);
}
.anima-upload-modal.hidden { display:none; }
.anima-upload-panel {
    width:min(940px, 100%);
    max-height:100%;
    display:flex;
    flex-direction:column;
    border-radius:14px;
    border:1px solid #26314c;
    background:linear-gradient(180deg, #0f1422 0%, #090d17 100%);
    box-shadow:0 28px 70px rgba(0,0,0,.42);
    overflow:hidden;
}
.anima-upload-header {
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:14px;
    padding:16px 18px 14px;
    border-bottom:1px solid #192235;
}
.anima-upload-copy { display:flex; flex-direction:column; gap:5px; }
.anima-upload-copy strong {
    font-size:14px;
    color:#edf2ff;
    letter-spacing:.01em;
}
.anima-upload-copy span {
    max-width:560px;
    font-size:11px;
    line-height:1.5;
    color:#9fb0d6;
}
.anima-upload-tools { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
.anima-upload-selection {
    min-width:72px;
    padding:6px 8px;
    border-radius:999px;
    border:1px solid #263650;
    background:#0c1220;
    color:#9fb0d6;
    font-size:10px;
    text-align:center;
    white-space:nowrap;
}
.anima-upload-options {
    display:grid;
    grid-template-columns:repeat(2, minmax(0, 1fr));
    gap:10px;
    padding:0 18px 14px;
    border-bottom:1px solid #192235;
}
.anima-upload-option {
    display:grid;
    grid-template-columns:auto 1fr;
    grid-template-rows:auto auto;
    column-gap:10px;
    row-gap:2px;
    align-items:center;
    padding:10px 12px;
    border:1px solid #24304a;
    border-radius:10px;
    background:#10182b;
    cursor:pointer;
}
.anima-upload-option:hover {
    border-color:#3d5385;
    background:#14203a;
}
.anima-upload-option input {
    grid-row:1 / span 2;
    width:14px;
    height:14px;
    accent-color:#79a0ff;
}
.anima-upload-option-title {
    font-size:11px;
    font-weight:600;
    color:#eef4ff;
}
.anima-upload-option small {
    color:#9cafda;
    font-size:10px;
    line-height:1.4;
}
.anima-upload-body {
    padding:16px 18px 18px;
    overflow:auto;
    min-height:260px;
    max-height:min(72vh, 720px);
}
.anima-upload-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(190px, 1fr));
    gap:12px;
}
.anima-upload-empty {
    min-height:260px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:10px;
    text-align:center;
    color:#90a0c8;
}
.anima-upload-empty strong {
    font-size:13px;
    color:#e3ebff;
}
.anima-upload-empty span {
    max-width:460px;
    font-size:11px;
    line-height:1.5;
    color:#90a0c8;
}
.anima-upload-empty-loading strong,
.anima-upload-empty-loading span { color:#a8b8db; }
.anima-upload-card {
    display:flex;
    flex-direction:column;
    background:#0d1220;
    border:1px solid #1f2940;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 10px 28px rgba(0,0,0,.24);
    transition:transform .14s ease, border-color .14s ease, box-shadow .14s ease;
}
.anima-upload-card:hover {
    transform:translateY(-2px);
    border-color:#3e5384;
    box-shadow:0 16px 34px rgba(0,0,0,.32);
}
.anima-upload-card.selected {
    border-color:#79a0ff;
    box-shadow:0 0 0 2px rgba(121,160,255,.18), 0 16px 34px rgba(0,0,0,.32);
}
.anima-upload-thumb {
    position:relative;
    aspect-ratio:1.08;
    background:#080b13;
    overflow:hidden;
}
.anima-upload-thumb img {
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
}
.anima-upload-thumb.no-img {
    display:flex;
    align-items:center;
    justify-content:center;
}
.anima-upload-thumb.no-img::after {
    content:attr(data-init);
    font-family:'JetBrains Mono',monospace;
    font-size:28px;
    color:#2c3550;
}
.anima-upload-badge {
    position:absolute;
    left:10px;
    top:10px;
    max-width:calc(100% - 20px);
    padding:5px 8px;
    border-radius:999px;
    background:rgba(9, 14, 24, 0.84);
    border:1px solid #31466f;
    color:#dfeaff;
    font-size:10px;
    font-family:'JetBrains Mono',monospace;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    backdrop-filter:blur(8px);
}
.anima-upload-select {
    position:absolute;
    right:10px;
    top:10px;
    max-width:calc(100% - 20px);
    min-height:24px;
    padding:4px 8px;
    border-radius:999px;
    border:1px solid #31466f;
    background:rgba(9, 14, 24, 0.84);
    color:#dfeaff;
    font-size:10px;
    font-weight:700;
    cursor:pointer;
    backdrop-filter:blur(8px);
}
.anima-upload-select[aria-pressed="true"] {
    border-color:#89a9ff;
    background:rgba(40, 68, 130, 0.9);
    color:#ffffff;
}
.anima-upload-meta {
    display:flex;
    flex-direction:column;
    gap:8px;
    padding:11px;
}
.anima-upload-row {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
}
.anima-upload-artist {
    font-family:'JetBrains Mono',monospace;
    font-size:10px;
    color:#d9e5ff;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
}
.anima-upload-time {
    font-family:'JetBrains Mono',monospace;
    font-size:9px;
    color:#7586af;
    white-space:nowrap;
}
.anima-upload-prompt {
    min-height:46px;
    margin:0;
    color:#9fb0d6;
    font-size:10px;
    line-height:1.45;
    display:-webkit-box;
    -webkit-line-clamp:3;
    -webkit-box-orient:vertical;
    overflow:hidden;
}
.anima-upload-action {
    width:100%;
    min-height:30px;
    border-radius:8px;
    border:1px solid #385083;
    background:#17213a;
    color:#d8e5ff;
    font-size:10.5px;
    font-weight:600;
    cursor:pointer;
    transition:all .14s ease;
}
.anima-upload-action:hover {
    background:#203055;
    border-color:#5775bf;
    color:#ffffff;
}
.anima-upload-action:disabled {
    opacity:.65;
    cursor:wait;
}
`;

s.textContent += `
.anima-key-modal {
    position:absolute;
    inset:0;
    z-index:31;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
    background:rgba(5, 8, 14, 0.78);
    backdrop-filter:blur(8px);
}
.anima-key-modal.hidden { display:none; }
.anima-key-panel {
    width:min(640px, 100%);
    border-radius:14px;
    border:1px solid #26314c;
    background:linear-gradient(180deg, #0f1422 0%, #090d17 100%);
    box-shadow:0 28px 70px rgba(0,0,0,.42);
    overflow:hidden;
}
.anima-key-header {
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:14px;
    padding:16px 18px 14px;
    border-bottom:1px solid #192235;
}
.anima-key-copy { display:flex; flex-direction:column; gap:5px; }
.anima-key-copy strong {
    font-size:14px;
    color:#edf2ff;
    letter-spacing:.01em;
}
.anima-key-copy span {
    font-size:11px;
    line-height:1.55;
    color:#9fb0d6;
    max-width:520px;
}
.anima-key-body {
    padding:16px 18px 8px;
    display:flex;
    flex-direction:column;
    gap:12px;
}
.anima-key-link {
    display:inline-flex;
    align-self:flex-start;
    min-height:28px;
    padding:6px 10px;
    border-radius:8px;
    border:1px solid #385083;
    background:#17213a;
    color:#d8e5ff;
    text-decoration:none;
    font-size:10.5px;
    font-weight:600;
}
.anima-key-link:hover {
    background:#203055;
    border-color:#5775bf;
    color:#ffffff;
}
.anima-key-field {
    display:flex;
    flex-direction:column;
    gap:6px;
}
.anima-key-field span {
    color:#dce6ff;
    font-size:11px;
    font-weight:600;
}
.anima-key-field textarea {
    width:100%;
    resize:vertical;
    min-height:84px;
    padding:12px 14px;
    border-radius:12px;
    border:1px solid #24304a;
    background:#0b1120;
    color:#e8efff;
    font-family:'JetBrains Mono',monospace;
    font-size:11px;
    line-height:1.5;
    box-sizing:border-box;
}
.anima-key-hint {
    margin:0;
    color:#8ea1cf;
    font-size:10.5px;
    line-height:1.5;
}
.anima-key-actions {
    display:flex;
    justify-content:flex-end;
    padding:0 18px 18px;
}
`;
    document.head.appendChild(s);
}


