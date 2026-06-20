export function injectCSS() {
    if (document.getElementById("anima-css")) return;
    const s = document.createElement("style");
    s.id = "anima-css";
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

#anima-browser { --anima-accent:#7891cf; --anima-accent-hover:#91a6d8; --anima-accent-strong:#5e71a1; --anima-accent-soft:rgba(120,145,207,.22); --anima-accent-wash:rgba(120,145,207,.12); --anima-accent-ring:rgba(120,145,207,.36); --anima-bg:#0b0b0f; --anima-backdrop:rgba(0,0,0,.8); --anima-scrim:rgba(3,6,12,.6); --anima-modal-scrim:rgba(5,8,14,.78); --anima-card-overlay-bg:rgba(0,0,0,.65); --anima-panel:#111827; --anima-panel-2:#0e1220; --anima-surface:#10182b; --anima-surface-hover:#17213a; --anima-border:#27304a; --anima-border-strong:#334265; --anima-text:#eef3ff; --anima-text-2:#d8e5ff; --anima-muted:#9fb0d6; --anima-muted-2:#667085; --anima-danger:#d8799b; --anima-success:#68b99a; --anima-canvas-character-bg:#111827; --anima-canvas-style-bg:#0f1324; --anima-canvas-character-border:#31515f; --anima-canvas-style-border:#2b3552; --anima-canvas-character-text:#9bd7ef; --anima-canvas-style-text:#aebce2; --anima-radius:8px; --anima-control-radius:8px; --anima-control-height:30px; --anima-control-padding:6px 10px; --anima-select-padding:6px 24px 6px 10px; --anima-control-bg:var(--anima-surface); --anima-control-border:var(--anima-border); --anima-control-fg:var(--anima-text-2); --anima-control-muted-fg:var(--anima-muted); --anima-control-hover-bg:var(--anima-accent-soft); --anima-control-hover-border:var(--anima-accent); --anima-control-hover-fg:var(--anima-text); --anima-shadow-sm:0 8px 18px rgba(0,0,0,.34); --anima-shadow-md:0 10px 22px rgba(0,0,0,.36); --anima-shadow-lg:0 14px 34px rgba(0,0,0,.42); --anima-shadow-xl:0 16px 40px rgba(0,0,0,.48); --anima-window-shadow:0 18px 46px rgba(0,0,0,.62); --anima-font-ui:11px; --anima-font-small:10px; --anima-icon-size:30px; position:fixed; inset:0; z-index:99998; display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; }
#anima-browser.hidden { display:none; }
#anima-browser .backdrop { position:absolute; inset:0; background:var(--anima-backdrop, rgba(0,0,0,.8)); }
#anima-browser .window { position:relative; z-index:1; width:min(98vw,1540px); height:min(95vh,980px); background:var(--anima-bg); border:1px solid var(--anima-border-strong); border-radius:14px; display:flex; flex-direction:column; overflow:hidden; box-shadow:var(--anima-window-shadow); }

#anima-browser .hdr { display:flex; align-items:center; gap:7px; padding:9px 12px; border-bottom:1px solid var(--anima-border); background:var(--anima-panel); flex-shrink:0; flex-wrap:nowrap; }
#anima-browser .hdr-title { font-size:13px; font-weight:700; color:var(--anima-text); letter-spacing:.02em; white-space:nowrap; }
#anima-browser .hdr-tabs { display:flex; align-items:center; gap:5px; flex:1 1 auto; min-width:0; overflow-x:auto; overflow-y:hidden; flex-wrap:nowrap; margin-left:6px; scrollbar-width:none; }
#anima-browser .hdr-tabs::-webkit-scrollbar { display:none; }
#anima-browser .hdr-gap { display:none; }
.anima-control,
#anima-browser input[type="text"],
#anima-browser input[type="search"],
#anima-browser input[type="number"],
#anima-browser textarea { box-sizing:border-box; min-height:var(--anima-control-height); padding:var(--anima-control-padding); background:var(--anima-control-bg, var(--anima-surface, rgba(0,0,0,.25))); border:1px solid var(--anima-control-border, var(--anima-border, #2a2a40)); border-radius:var(--anima-control-radius); color:var(--anima-control-fg, var(--anima-text-2, #dce6ff)); font-family:'Inter',sans-serif; font-size:var(--anima-font-ui); font-weight:600; line-height:1.2; outline:none; cursor:pointer; transition:background-color .12s, border-color .12s, color .12s; }
#anima-browser input[type="text"],
#anima-browser input[type="search"],
#anima-browser input[type="number"],
#anima-browser textarea { cursor:text; font-weight:500; }
.anima-control:hover,
.anima-control.active { background:var(--anima-control-hover-bg, var(--anima-accent-soft, rgba(0,0,0,.45))); border-color:var(--anima-control-hover-border, var(--anima-accent, #52689c)); color:var(--anima-control-hover-fg, var(--anima-text, #fff)); }
.anima-control:focus,
#anima-browser input[type="text"]:focus,
#anima-browser input[type="search"]:focus,
#anima-browser input[type="number"]:focus,
#anima-browser textarea:focus { border-color:var(--anima-accent); }
select.anima-control,
#anima-browser .hdr-select { width:max-content; min-width:max-content; max-width:100%; padding:var(--anima-select-padding); background:var(--anima-control-bg) linear-gradient(45deg, transparent 50%, var(--anima-muted) 50%) right 11px center/6px 6px no-repeat; appearance:none; }
.anima-control-icon { width:var(--anima-icon-size); min-width:var(--anima-icon-size); height:var(--anima-control-height); padding:0; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--anima-control-muted-fg); font-size:13px; }
.anima-control-full { width:100%; }
#anima-browser .hdr-btn,
#anima-browser .hdr-close { display:inline-flex; align-items:center; justify-content:center; }
#anima-browser .hdr > .hdr-close { margin-left:0 !important; }
#anima-browser .hdr-btn-txt { flex:0 0 auto; color:var(--anima-control-muted-fg); margin-right:2px; }
#anima-browser .hdr-btn-txt.disabled { opacity:0.5; pointer-events:none; }

#anima-browser .top-cycle-bar { display:flex; align-items:center; gap:6px; min-height:31px; padding:3px 6px; border:1px solid var(--anima-border); border-radius:9px; background:var(--anima-panel-2); flex:0 0 auto; min-width:0; }
#anima-browser .top-search-tools { display:flex; align-items:center; gap:7px; flex:0 1 auto; min-width:0; max-width:100%; }
#anima-browser .cycle-bar { display:flex; align-items:center; gap:8px; padding:8px 14px; border-bottom:1px solid var(--anima-border); background:var(--anima-panel); flex-shrink:0; flex-wrap:wrap; }
#anima-browser .cycle-label { font-size:10.5px; color:var(--anima-muted); font-family:'JetBrains Mono',monospace; white-space:nowrap; }
.anima-play-btn { border-color:var(--anima-accent-strong); background:var(--anima-accent-soft); color:var(--anima-text-2); white-space:nowrap; }
.anima-play-btn:hover { background:var(--anima-accent-wash); border-color:var(--anima-accent); color:var(--anima-text); }
.anima-play-btn.running { background:var(--anima-accent-soft); border-color:var(--anima-accent-hover); color:var(--anima-text); }
.anima-play-btn .btn-lbl { display:none; }
.anima-play-btn .btn-icon { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; flex:0 0 16px; font-size:13px; line-height:1; }
.cycle-settings-wrap { position:relative; display:flex; align-items:center; }
.cycle-settings-panel { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:min(680px, calc(100vw - 32px)); max-height:calc(100vh - 44px); overflow:auto; padding:14px; border-radius:12px; border:1px solid var(--anima-border-strong); background:var(--anima-panel); box-shadow:var(--anima-shadow-xl), 0 0 0 9999px var(--anima-scrim); z-index:90; box-sizing:border-box; }
.cycle-settings-panel.hidden { display:none; }
.cycle-settings-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--anima-border); }
.cycle-settings-head div { display:flex; flex-direction:column; gap:3px; }
.cycle-settings-head strong { color:var(--anima-text); font-size:15px; letter-spacing:.01em; }
.cycle-settings-head span { color:var(--anima-muted); font-size:11px; line-height:1.35; }
.cycle-settings-head button { flex-shrink:0; }
#anima-browser .cycle-settings-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
#anima-browser .cycle-settings-grid .cycle-control { width:100%; min-height:52px; box-sizing:border-box; justify-content:space-between; align-items:flex-start; padding:8px 9px; }
#anima-browser .cycle-settings-grid .cycle-control { display:grid; grid-template-columns:minmax(76px, 1fr) auto; grid-template-rows:auto auto; column-gap:8px; row-gap:3px; border-color:var(--anima-border); background:var(--anima-panel-2); }
#anima-browser .cycle-settings-grid .cycle-control span { grid-column:1; grid-row:1; padding-top:4px; color:var(--anima-text-2); font-size:10.8px; }
#anima-browser .cycle-settings-grid .cycle-control select,
#anima-browser .cycle-settings-grid .cycle-control input { grid-column:2; grid-row:1; justify-self:start; min-height:var(--anima-control-height); }
#anima-browser .cycle-settings-grid .cycle-control small { grid-column:1 / -1; grid-row:2; color:var(--anima-muted); font-size:9.3px; line-height:1.2; }
.anima-cycle-status { flex:0 0 auto; max-width:none; overflow:visible; white-space:nowrap; font-size:10.5px; color:var(--anima-muted); font-family:'JetBrains Mono',monospace; }
.anima-cycle-status.active { color:var(--anima-success); }
#anima-browser .cycle-control { display:inline-flex; align-items:center; gap:5px; min-height:var(--anima-control-height); padding:var(--anima-control-padding); border:1px solid var(--anima-border); border-radius:var(--anima-control-radius); background:var(--anima-surface); color:var(--anima-muted); font-size:var(--anima-font-small); font-weight:600; }
#anima-browser .cycle-control span { color:var(--anima-muted); font-size:9.5px; white-space:nowrap; }
#anima-browser .cycle-control input { min-height:var(--anima-control-height); border:1px solid var(--anima-border); background:var(--anima-surface); color:var(--anima-text-2); border-radius:var(--anima-control-radius); font-size:var(--anima-font-ui); outline:none; padding:var(--anima-control-padding); }
#anima-browser .cycle-control select { width:max-content; min-width:max-content; max-width:220px; }
#anima-browser .cycle-control-disabled { opacity:.55; }
#anima-browser .cycle-control-disabled select,
#anima-browser .cycle-control-disabled input,
#anima-browser .cycle-control-disabled button { cursor:not-allowed; }
#anima-browser .cycle-control-small input { width:42px; text-align:center; }
#anima-browser .cycle-count-toggle { display:inline-flex; align-items:center; gap:7px; padding-top:3px !important; }
#anima-browser .cycle-count-toggle input { width:14px !important; min-height:14px !important; accent-color:var(--anima-accent); }
#anima-browser .cycle-count-toggle span { padding:0 !important; color:var(--anima-text-2); font-size:11px; }
#anima-browser .cycle-settings-grid .cycle-control select { width:max-content; min-width:max-content; max-width:220px; }
#anima-browser .cycle-settings-grid .cycle-control input { width:154px; max-width:154px; min-height:var(--anima-control-height); font-size:var(--anima-font-ui); }
#anima-browser .cycle-settings-panel input[type="number"]::-webkit-outer-spin-button,
#anima-browser .cycle-settings-panel input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
#anima-browser .cycle-settings-panel input[type="number"] { appearance:textfield; -moz-appearance:textfield; }
#anima-browser .cycle-settings-grid .cycle-control-small > input { width:72px; text-align:center; }
#anima-browser .cycle-settings-grid .cycle-stepper { grid-column:2; grid-row:1; justify-self:start; display:grid; grid-template-columns:28px 56px 28px; gap:4px; align-items:center; width:auto; max-width:none; }
#anima-browser .cycle-settings-grid .cycle-stepper button { font-size:14px; font-weight:800; line-height:1; }
#anima-browser .cycle-settings-grid .cycle-stepper input { grid-column:auto; grid-row:auto; width:56px; min-width:56px; height:var(--anima-control-height); text-align:center; }
#anima-browser .cycle-settings-grid .cycle-character-controls { grid-column:2; grid-row:1; justify-self:start; display:grid; grid-template-columns:auto auto; grid-template-rows:auto; gap:5px; align-items:center; width:auto; max-width:none; }
#anima-browser .cycle-settings-grid .cycle-character-controls .cycle-stepper { grid-column:1; grid-row:1; }
#anima-browser .cycle-settings-grid .cycle-character-mode-row { grid-column:2; grid-row:1; display:grid; grid-template-columns:1fr; align-items:center; width:100%; }
#anima-browser .cycle-settings-grid .cycle-character-mode-row select { grid-column:1; grid-row:1; width:max-content; min-width:max-content; max-width:160px; }
#anima-browser .cycle-settings-grid .cycle-control-range .cycle-range-inputs { grid-column:2; grid-row:1; justify-self:start; display:grid; grid-template-columns:62px auto 62px; gap:6px; align-items:center; width:auto; max-width:none; }
#anima-browser .cycle-settings-grid .cycle-control-range .cycle-range-inputs span { grid-column:auto; grid-row:auto; padding:0; color:var(--anima-muted); font-size:10px; text-align:center; }
#anima-browser .cycle-settings-grid .cycle-control-range input { grid-column:auto; grid-row:auto; width:100%; }
.cycle-record-actions { min-height:52px; display:flex; flex-direction:column; justify-content:center; gap:5px; padding:8px 9px; border:1px solid var(--anima-border); border-radius:var(--anima-control-radius); background:var(--anima-panel-2); }
.cycle-record-actions button { align-self:center; width:180px; }
.cycle-record-actions small { color:var(--anima-muted); font-size:9.5px; line-height:1.25; }
#anima-browser .cycle-search { position:relative; flex:1 1 clamp(120px, 16vw, 220px); min-width:120px; max-width:220px; margin-left:0; display:none; }
#anima-browser .cycle-search i { position:absolute; left:8px; top:50%; transform:translateY(-50%); color:var(--anima-muted-2); font-size:10px; font-family:'JetBrains Mono',monospace; font-style:normal; pointer-events:none; }
#anima-browser .cycle-search input { width:100%; padding-left:22px; color:var(--anima-text-2); font-family:'JetBrains Mono',monospace; }
#anima-browser .cycle-search input:focus { border-color:var(--anima-accent); }
#anima-browser .top-search-toggle { flex:0 0 var(--anima-icon-size); min-width:var(--anima-icon-size); }
#anima-browser .top-search-tools.search-open { flex:0 1 clamp(210px, 24vw, 320px); min-width:210px; max-width:320px; }
#anima-browser .top-search-tools.search-open .cycle-search { display:block; }
#anima-browser .top-search-tools.search-open .top-search-toggle { background:var(--anima-accent-soft); border-color:var(--anima-accent); color:var(--anima-text); }
#anima-browser .top-search-tools .anima-sort-select { flex:0 0 auto; width:max-content; min-width:max-content; min-height:var(--anima-control-height); }
@media (max-width: 1180px) {
    #anima-browser .hdr-title { display:none; }
    #anima-browser .anima-cycle-status { display:none; }
    #anima-browser .top-search-tools.search-open { flex:0 1 300px; min-width:210px; max-width:320px; }
}
@media (max-width: 980px) {
    #anima-browser .cycle-label,
    #anima-browser .anima-fullet-auth { display:none !important; }
    #anima-browser .hdr-data-btns { border-left:0; padding-left:0; margin-left:0; }
}
@media (max-width: 900px) {
    #anima-browser .hdr { gap:6px; padding:8px 10px; }
    #anima-browser .hdr-tabs { margin-left:0; }
    #anima-browser .hdr-btn-txt { padding:6px 9px; }
    #anima-browser .top-cycle-bar { gap:4px; padding:2px 5px; }
    #anima-browser .anima-play-btn { width:var(--anima-icon-size); min-height:var(--anima-control-height); justify-content:center; padding:0; }
    #anima-browser .anima-play-btn .btn-lbl { display:none; }
    #anima-browser .top-search-tools { gap:6px; }
    #anima-browser .top-search-tools .anima-sort-select { flex-basis:auto; width:max-content; }
    #anima-browser .top-search-tools.search-open { flex:0 1 230px; min-width:190px; max-width:250px; }
}
@media (max-width: 620px) {
    #anima-browser .cycle-settings-panel { width:calc(100vw - 24px); }
    #anima-browser .cycle-settings-grid { grid-template-columns:1fr; }
    #anima-browser .cycle-settings-grid .cycle-control { grid-template-columns:126px minmax(0, 1fr); }
}
@media (max-width: 520px) {
    #anima-browser .hdr { flex-wrap:wrap; align-content:flex-start; gap:6px; padding:8px; }
    #anima-browser .hdr-tabs { order:6; flex:1 0 100%; width:100%; margin-left:0; }
    #anima-browser .top-cycle-bar { order:1; }
    #anima-browser .top-search-tools { order:2; flex:1 1 136px; min-width:132px; }
    #anima-browser .top-search-tools .anima-sort-select { flex:0 1 auto; width:max-content; min-width:max-content; max-width:100%; }
    #anima-browser #anima-fullet-connect,
    #anima-browser #anima-fullet-disconnect,
    #anima-browser #anima-fullet-upload { order:3; padding:6px 7px; font-size:9px; }
    #anima-browser .hdr-data-btns { order:4; margin-left:0; padding-left:0; }
    #anima-browser .hdr > .hdr-close { order:5; margin-left:auto !important; }
    #anima-browser .hdr-settings-menu { position:fixed; right:12px; left:auto; top:68px; width:min(204px, calc(100vw - 24px)); max-width:calc(100vw - 24px); max-height:calc(100vh - 92px); overflow:auto; }
    #anima-browser .anima-chunk { grid-template-columns:repeat(var(--anima-grid-mobile-columns, 2), minmax(0, 1fr)); }
    #anima-browser .cycle-settings-panel { width:calc(100vw - 24px); padding:14px; }
    #anima-browser .cycle-settings-grid { grid-template-columns:1fr; }
    #anima-browser .cycle-settings-grid .cycle-control { grid-template-columns:1fr; }
    #anima-browser .cycle-settings-grid .cycle-control span,
    #anima-browser .cycle-settings-grid .cycle-control select,
    #anima-browser .cycle-settings-grid .cycle-control input,
    #anima-browser .cycle-settings-grid .cycle-stepper,
    #anima-browser .cycle-settings-grid .cycle-character-controls,
    #anima-browser .cycle-settings-grid .cycle-control-range .cycle-range-inputs { grid-column:1; }
    #anima-browser .cycle-settings-grid .cycle-control select,
    #anima-browser .cycle-settings-grid .cycle-control input,
    #anima-browser .cycle-settings-grid .cycle-stepper,
    #anima-browser .cycle-settings-grid .cycle-character-controls { grid-row:auto; }
    #anima-browser .cycle-settings-grid .cycle-control select,
    #anima-browser .cycle-settings-grid .cycle-control input,
    #anima-browser .cycle-settings-grid .cycle-stepper,
    #anima-browser .cycle-settings-grid .cycle-character-controls,
    #anima-browser .cycle-settings-grid .cycle-control-range .cycle-range-inputs,
    .cycle-record-actions button { justify-self:stretch; align-self:stretch; max-width:none; width:100%; }
}

#anima-browser .anima-prompt-panel { position:relative; display:grid; grid-template-columns:118px minmax(0, 1fr); gap:8px; align-items:stretch; padding:9px 38px 9px 12px; border-bottom:1px solid var(--anima-border); background:var(--anima-panel-2); flex-shrink:0; overflow:visible; }
#anima-browser .anima-prompt-head { display:flex; flex-direction:column; justify-content:center; gap:5px; color:var(--anima-text-2); font-size:11px; font-weight:700; }
#anima-browser .anima-prompt-title { color:var(--anima-text-2); font-size:11px; font-weight:700; }
#anima-browser .anima-prompt-head small { display:none; }
#anima-browser .anima-prompt-toggle { position:absolute; right:8px; bottom:-1px; width:24px; height:18px; padding:0; border:0; border-radius:5px 5px 0 0; background:transparent; color:var(--anima-muted); cursor:pointer; opacity:.85; }
#anima-browser .anima-prompt-toggle::before { content:""; position:absolute; left:50%; top:50%; transform:translate(-50%,-28%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid currentColor; }
#anima-browser .anima-prompt-toggle:hover { background:var(--anima-accent-wash); color:var(--anima-text); opacity:1; }
#anima-browser .anima-prompt-subject { display:flex; flex-direction:column; gap:4px; margin-top:4px; color:var(--anima-muted); font-size:9.5px; font-weight:600; }
#anima-browser .anima-prompt-subject select { width:100%; min-width:0; max-width:100%; min-height:var(--anima-control-height); }
#anima-browser #anima-prompt-editor { width:100%; min-height:58px; max-height:112px; resize:none; font-family:'JetBrains Mono',monospace; line-height:1.45; }
#anima-browser #anima-prompt-editor:focus { border-color:var(--anima-accent); }
#anima-browser .anima-prompt-panel.collapsed { display:block; height:0; min-height:0; padding:0; border-bottom:0; background:transparent; }
#anima-browser .anima-prompt-panel.collapsed .anima-prompt-head,
#anima-browser .anima-prompt-panel.collapsed #anima-prompt-editor { display:none; }
#anima-browser .anima-prompt-panel.collapsed .anima-prompt-toggle { right:8px; bottom:-18px; }
#anima-browser .anima-prompt-panel.collapsed .anima-prompt-toggle::before { transform:translate(-50%,-72%); border-top:0; border-bottom:8px solid currentColor; }

#anima-browser .body { flex:1; overflow-y:auto; padding:14px; scrollbar-width:thin; scrollbar-color:var(--anima-border) transparent; }
#anima-browser .body::-webkit-scrollbar { width:5px; }
#anima-browser .body::-webkit-scrollbar-thumb { background:var(--anima-border); border-radius:3px; }

.anima-grid { --anima-grid-columns:4; --anima-grid-mobile-columns:2; }
.anima-chunk { display:grid; grid-template-columns:repeat(var(--anima-grid-columns, 4), minmax(0, 1fr)); gap:2px; width:100%; contain:content; }
.anima-favorites-toolbar { position:sticky; top:0; z-index:9; grid-column:1/-1; display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:0 0 10px; padding:8px 10px; border:1px solid var(--anima-border); border-radius:8px; background:var(--anima-panel); }
.anima-favorites-toolbar span,
.anima-favorites-toolbar i { color:var(--anima-muted); font-size:10px; font-family:'JetBrains Mono',monospace; font-style:normal; }
.anima-favorites-toolbar select { max-width:min(260px, 45vw); }
.anima-favorite-category-editor { display:inline-flex; align-items:center; gap:6px; }
.anima-favorite-category-editor.hidden { display:none; }
.anima-favorite-category-editor input { width:150px; max-width:34vw; }
.anima-favorite-category-editor input::placeholder { color:var(--anima-muted-2); }
.anima-favorite-category-editor input:focus { border-color:var(--anima-accent); }
.anima-empty { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; gap:10px; padding:60px; color:var(--anima-muted-2); font-size:12px; }
.anima-net-gate { color:var(--anima-muted); text-align:center; }
.anima-net-gate strong { font-family:'JetBrains Mono',monospace; font-size:18px; letter-spacing:.08em; color:var(--anima-text-2); }
.anima-net-gate span { max-width:420px; line-height:1.5; color:var(--anima-muted); }
.anima-remote-notice { display:flex; align-items:center; gap:10px; margin:0 0 12px; padding:10px 12px; border:1px solid var(--anima-border-strong); border-radius:8px; background:var(--anima-surface); color:var(--anima-muted); font-size:11px; }
.anima-remote-notice strong { color:var(--anima-text-2); white-space:nowrap; }
.anima-remote-notice span { color:var(--anima-muted); line-height:1.35; }
.anima-remote-notice b { color:var(--anima-text-2); }

.hdr-toggle-wrap { display:inline-flex; align-items:center; gap:10px; margin-right:6px; background:var(--anima-panel-2); padding:5px 10px 5px 12px; border-radius:10px; border:1px solid var(--anima-border); }
.hdr-switch { position:relative; display:inline-block; width:34px; height:20px; transition:transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275); flex-shrink:0; }
.hdr-switch input { opacity:0; width:0; height:0; }
.hdr-slider { position:absolute; cursor:pointer; inset:0; background-color:var(--anima-surface); transition:.2s; border-radius:999px; border:1px solid var(--anima-border-strong); }
.hdr-slider:before { position:absolute; content:''; height:12px; width:12px; left:3px; bottom:3px; background-color:var(--anima-muted); transition:.2s; border-radius:50%; }
.hdr-switch:hover { transform:scale(1.08); }
input:checked + .hdr-slider { background-color:var(--anima-accent-soft); border-color:var(--anima-accent); }
input:checked + .hdr-slider:before { transform:translateX(14px); background-color:var(--anima-accent); }

.hdr-data-btns { display:flex; align-items:center; justify-content:flex-end; gap:7px; margin-left:auto; border-left:1px solid var(--anima-border); padding-left:9px; align-self:center; }
.hdr-settings-wrap { position:relative; display:flex; align-items:center; }
.hdr-settings-wrap #anima-settings-gear { font-size:15px; color:var(--anima-muted); }
.hdr-settings-wrap:hover #anima-settings-gear,
.hdr-settings-wrap:focus-within #anima-settings-gear { color:var(--anima-text); border-color:var(--anima-accent); background:var(--anima-accent-soft); }
.hdr-settings-menu {
    --anima-settings-font:11px;
    --anima-settings-title-font:10.5px;
    --anima-settings-row-height:30px;
    position:absolute;
    top:calc(100% + 6px);
    right:0;
    width:min(204px, calc(100vw - 20px));
    padding:6px;
    border-radius:8px;
    border:1px solid var(--anima-border-strong);
    background:var(--anima-panel);
    box-shadow:var(--anima-shadow-md);
    display:grid;
    grid-template-columns:1fr;
    gap:4px;
    opacity:0;
    transform:translateY(-6px) scale(.98);
    pointer-events:none;
    transition:opacity .14s ease, transform .14s ease;
    z-index:40;
    box-sizing:border-box;
}
.hdr-settings-wrap:hover .hdr-settings-menu,
.hdr-settings-wrap:focus-within .hdr-settings-menu {
    opacity:1;
    transform:translateY(0) scale(1);
    pointer-events:auto;
}
.hdr-settings-row {
    display:grid;
    grid-template-columns:1fr auto;
    align-items:center;
    gap:8px;
    min-height:30px;
    padding:5px 8px;
    border:1px solid transparent;
    border-radius:7px;
    background:transparent;
    color:var(--anima-text-2);
    font-size:var(--anima-settings-font);
    font-weight:650;
    line-height:1.2;
    cursor:pointer;
    box-sizing:border-box;
}
.hdr-settings-row:hover { background:var(--anima-accent-wash); border-color:var(--anima-accent); color:var(--anima-text); }
.hdr-settings-row > span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.hdr-settings-switch-row { background:var(--anima-surface); border-color:var(--anima-border); }
.hdr-settings-switch-row:hover { background:var(--anima-accent-wash); border-color:var(--anima-accent); }
.hdr-settings-switch-row .hdr-switch { margin-left:auto; }
.hdr-settings-row > input[type="checkbox"] { width:15px; height:15px; accent-color:var(--anima-accent); flex:0 0 auto; }
.hdr-settings-select-row select { max-width:100%; }
#anima-browser .hdr-settings-select-row select { width:58px; min-width:58px; min-height:var(--anima-settings-row-height); text-align:center; font-size:var(--anima-settings-font); }
.hdr-settings-select-row select:focus { border-color:var(--anima-accent); }
.hdr-theme-colors { display:grid; grid-template-columns:1fr; gap:4px; padding:6px; border:1px solid var(--anima-border); border-radius:8px; background:var(--anima-panel-2); }
.hdr-theme-colors-title { padding:0 2px 2px; color:var(--anima-text); font-size:var(--anima-settings-title-font); font-weight:700; line-height:1.2; }
.hdr-theme-colors .hdr-settings-row { background:var(--anima-surface); }
.hdr-settings-color-row input[type="color"] { width:42px; height:calc(var(--anima-settings-row-height) - 4px); padding:2px; border:1px solid var(--anima-border); border-radius:var(--anima-control-radius); background:var(--anima-surface); cursor:pointer; }
.hdr-settings-color-row input[type="color"]::-webkit-color-swatch-wrapper { padding:0; }
.hdr-settings-color-row input[type="color"]::-webkit-color-swatch { border:0; border-radius:4px; }
.hdr-settings-tabs {
    display:grid;
    grid-template-columns:1fr;
    gap:2px;
    padding:5px 0;
    border-top:1px solid var(--anima-border);
    border-bottom:1px solid var(--anima-border);
    background:transparent;
}
.hdr-settings-tabs > span { padding:0 8px 3px; color:var(--anima-muted); font-size:var(--anima-settings-title-font); font-weight:700; line-height:1.2; }
.hdr-tab-chip {
    display:grid;
    grid-template-columns:1fr auto;
    align-items:center;
    gap:8px;
    min-width:0;
    min-height:24px;
    padding:5px 8px;
    border:1px solid transparent;
    border-radius:7px;
    background:transparent;
    color:var(--anima-text-2);
    font-size:var(--anima-settings-font);
    font-weight:500;
    line-height:1.2;
    cursor:pointer;
    box-sizing:border-box;
}
.hdr-tab-chip:hover { background:var(--anima-accent-wash); border-color:var(--anima-accent); color:var(--anima-text); }
.hdr-tab-chip span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.hdr-tab-chip input { width:15px; height:15px; accent-color:var(--anima-accent); justify-self:end; }
.hdr-settings-actions { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:4px; padding-top:1px; }
.hdr-settings-actions:empty { display:none; }
.hdr-settings-actions:not(:has(.hdr-settings-item:not(.hidden))) { display:none; }
.hdr-settings-item { width:100%; min-height:var(--anima-settings-row-height); margin-right:0; text-align:center; font-size:var(--anima-settings-font); line-height:1.15; white-space:normal; }
.hdr-settings-item.hidden, .hdr-settings-option.hidden, .hdr-export-progress.hidden { display:none; }
.hdr-export-progress { display:flex; flex-direction:column; gap:5px; padding:7px 8px; border:1px solid var(--anima-border); border-radius:7px; background:var(--anima-surface); color:var(--anima-muted); font-size:10px; }
.hdr-export-progress div { height:5px; overflow:hidden; border-radius:999px; background:var(--anima-panel-2); }
.hdr-export-progress i { display:block; width:0%; height:100%; border-radius:999px; background:var(--anima-accent); transition:width .12s ease; }

.anima-spinner { width:24px; height:24px; border:2px solid var(--anima-border); border-top-color:var(--anima-accent); border-radius:50%; animation:anima-spin .6s linear infinite; }
@keyframes anima-spin { to { transform:rotate(360deg); } }

.anima-card { position:relative; border-radius:8px; overflow:hidden; background:var(--anima-surface); border:1px solid var(--anima-border); cursor:pointer; transition:border-color .12s; }
.anima-card:hover { border-color:var(--anima-border-strong); }
.anima-card.selected { border-color:var(--anima-success); }
.anima-card.favorited { border-color:var(--anima-accent); border-width:2px; box-shadow:inset 0 0 0 4px var(--anima-accent-ring); }
.anima-card.favorited .anima-card-fav { border-color:var(--anima-accent-hover); background:var(--anima-accent-soft); color:var(--anima-text); }
.anima-card-removing { opacity:.35; pointer-events:none; transition:opacity .14s ease; }
.anima-card-img { position:relative; overflow:hidden; background:var(--anima-panel-2); }
.anima-card-img.is-loading { min-height:180px; background:var(--anima-panel-2); }
.anima-card-img.is-loading img { opacity:0; }
.anima-card-img img { width:100%; height:auto; object-fit:contain; display:block; transition:opacity .12s ease; }
.anima-card-img-contain { background:var(--anima-surface); }
.anima-card-img.no-img { aspect-ratio:1; display:flex; align-items:center; justify-content:center; }
.anima-card-img.no-img::after { content:attr(data-init); font-family:'JetBrains Mono',monospace; font-size:26px; font-weight:700; color:var(--anima-muted-2); text-transform:uppercase; }
.anima-card-overlay { position:absolute; inset:0; background:var(--anima-card-overlay-bg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; flex-wrap:nowrap; padding:10px; box-sizing:border-box; opacity:0; transition:opacity .18s; }
.anima-uniqueness-rank { position:absolute; top:8px; left:8px; min-width:44px; height:28px; padding:0 10px; border-radius:999px; background:var(--anima-panel); border:1px solid var(--anima-border); color:var(--anima-text-2); font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; z-index:2; }
.anima-card:hover .anima-card-overlay { opacity:1; }
.anima-card-pick { min-width:82px; }
.anima-card-fav { min-width:82px; }
.anima-card-trigger-tags { margin-left:0; }
.anima-card-action-menu { position:absolute; left:8px; right:8px; top:50%; transform:translateY(-50%); z-index:6; display:flex; flex-direction:column; gap:6px; padding:9px; border-radius:8px; border:1px solid var(--anima-border-strong); background:var(--anima-panel); }
.anima-card-action-title { color:var(--anima-text); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.anima-card-action-text { color:var(--anima-muted); font-size:9.5px; line-height:1.35; font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-action-row { display:flex; align-items:center; gap:6px; }
.anima-card-action-row button { flex:1; min-height:var(--anima-control-height); border-radius:var(--anima-control-radius); font-size:var(--anima-font-ui); font-weight:600; }
.anima-style-apply-modal { position:absolute; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:18px; }
.anima-style-apply-backdrop { position:absolute; inset:0; background:var(--anima-scrim); }
.anima-style-apply-panel { position:relative; width:min(420px, 100%); border-radius:12px; border:1px solid var(--anima-border-strong); background:var(--anima-panel); box-shadow:var(--anima-shadow-lg); overflow:hidden; }
.anima-style-apply-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px 16px 12px; border-bottom:1px solid var(--anima-border); }
.anima-style-apply-head div { min-width:0; display:flex; flex-direction:column; gap:4px; }
.anima-style-apply-head strong { color:var(--anima-text); font-size:13px; }
.anima-style-apply-head span { color:var(--anima-muted); font-family:'JetBrains Mono',monospace; font-size:10.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-style-apply-close { flex-shrink:0; }
.anima-style-apply-body { display:flex; flex-direction:column; gap:8px; padding:14px 16px 16px; }
.anima-style-apply-choice { width:100%; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-style-apply-primary { border-color:var(--anima-accent); background:var(--anima-accent-soft); color:var(--anima-text); }
.anima-style-apply-list { display:flex; flex-direction:column; gap:7px; max-height:170px; overflow:auto; padding-right:3px; }
.anima-style-apply-empty { margin:2px 0 0; color:var(--anima-muted); font-size:10.5px; line-height:1.45; }
.anima-card-meta { position:absolute; left:0; right:0; bottom:0; z-index:4; padding:9px 10px 10px; box-sizing:border-box; background:var(--anima-panel); opacity:0; pointer-events:none; transition:opacity .12s ease; }
.anima-card:hover .anima-card-meta,
.anima-card:focus-within .anima-card-meta { opacity:1; }
.anima-card-tag { display:block; font-size:10px; font-weight:500; font-family:'JetBrains Mono',monospace; color:var(--anima-text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-trigger { display:block; margin-top:2px; font-size:9px; color:var(--anima-muted); font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-tags-preview { display:block; margin-top:2px; font-size:8.5px; color:var(--anima-muted); font-family:'JetBrains Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.anima-card-works { display:block; font-size:9px; color:var(--anima-muted); font-family:'JetBrains Mono',monospace; margin-top:2px; }
.anima-card-source { display:inline-flex; align-items:center; margin-left:6px; padding:1px 5px; border-radius:999px; border:1px solid var(--anima-border); background:var(--anima-surface); color:var(--anima-muted); font-size:8px; text-transform:uppercase; letter-spacing:.02em; vertical-align:middle; }
.anima-card-source-character { border-color:var(--anima-accent); background:var(--anima-accent-wash); color:var(--anima-text); }
.anima-card-source-artist { border-color:var(--anima-border-strong); background:var(--anima-panel-2); color:var(--anima-text-2); }

#anima-browser .ftr { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px; padding:8px 14px; border-top:1px solid var(--anima-border); background:var(--anima-panel-2); flex-shrink:0; }
#anima-browser .ftr-count { grid-column:1; justify-self:start; font-size:10px; font-family:'JetBrains Mono',monospace; color:var(--anima-muted); }
#anima-browser .anima-page-jump { grid-column:2; display:none; align-items:center; gap:6px; color:var(--anima-muted); font-size:10px; font-family:'JetBrains Mono',monospace; }
#anima-browser .anima-page-jump.visible { display:flex; }
#anima-browser .anima-page-jump input { width:3ch; min-width:3ch; line-height:var(--anima-control-height); padding:0 8px; font-family:'JetBrains Mono',monospace; text-align:center; box-sizing:content-box; appearance:textfield; -moz-appearance:textfield; }
#anima-browser .anima-page-jump input[type="number"]::-webkit-outer-spin-button,
#anima-browser .anima-page-jump input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
#anima-browser .anima-page-jump input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
#anima-browser .anima-page-jump .hdr-btn-txt { margin-right:0; }
#anima-browser .anima-generated-gate { gap:12px; max-width:520px; margin:60px auto; text-align:center; line-height:1.45; }
#anima-browser .anima-generated-gate strong { color:var(--anima-text); font-size:18px; }
#anima-browser .anima-generated-gate span { color:var(--anima-muted); font-size:12px; }
#anima-browser .anima-generated-actions,
#anima-browser .ftr-gap { display:none; }
#anima-browser .ftr-info-wrap { grid-column:3; justify-self:end; position:relative; display:flex; align-items:center; }
#anima-browser .ftr-info-btn { min-height:var(--anima-control-height); border-radius:var(--anima-control-radius); color:var(--anima-control-muted-fg); font-size:var(--anima-font-ui); font-family:'JetBrains Mono',monospace; padding:var(--anima-control-padding); }
#anima-browser .ftr-info-menu { position:absolute; right:0; bottom:calc(100% + 7px); min-width:220px; max-width:min(340px, calc(100vw - 28px)); display:flex; flex-direction:column; gap:7px; padding:9px; border-radius:8px; border:1px solid var(--anima-border-strong); background:var(--anima-panel); font-family:'JetBrains Mono',monospace; font-size:var(--anima-font-ui); font-weight:600; line-height:1.35; opacity:0; pointer-events:none; transition:opacity .12s ease; z-index:40; }
#anima-browser .ftr-info-wrap:hover .ftr-info-menu, #anima-browser .ftr-info-wrap:focus-within .ftr-info-menu { opacity:1; pointer-events:auto; }
#anima-browser .ftr-info-menu span, #anima-browser .ftr-info-menu a { color:var(--anima-muted); font:inherit; text-decoration:none; }
#anima-browser .ftr-info-menu a.anima-control { display:inline; min-height:0; padding:0; border:0; border-radius:0; background:transparent; color:var(--anima-text-2); vertical-align:baseline; }
#anima-browser .ftr-info-menu > a.anima-control { display:block; }
#anima-browser .ftr-info-menu a:hover { color:var(--anima-text); }

#anima-ac { position:fixed; z-index:99999; background:var(--anima-panel, #0d0d14); border:1px solid var(--anima-border, #1e1e2c); border-radius:8px; overflow:hidden; max-height:260px; overflow-y:auto; box-shadow:var(--anima-shadow-lg, 0 12px 36px rgba(0,0,0,.62)); font-family:'Inter',sans-serif; min-width:240px; scrollbar-width:thin; }
#anima-ac.hidden { display:none; }
.anima-ac-row { display:flex; align-items:center; gap:8px; padding:6px 10px; cursor:pointer; border-bottom:1px solid var(--anima-border, #12121a); transition:background .1s; }
.anima-ac-row:last-child { border-bottom:none; }
.anima-ac-row:hover,.anima-ac-row.on { background:var(--anima-surface-hover, #141422); }
.anima-ac-thumb { width:30px; height:30px; border-radius:4px; object-fit:cover; background:var(--anima-surface, #14141e); flex-shrink:0; }
.anima-ac-tag { flex:1; font-size:11.5px; font-family:'JetBrains Mono',monospace; color:var(--anima-muted, #8080a0); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.anima-ac-kind { font-size:8px; font-family:'JetBrains Mono',monospace; border:1px solid var(--anima-border, #2f4268); border-radius:999px; padding:1px 5px; color:var(--anima-muted, #a9c2ff); background:var(--anima-surface, #10192b); }
.anima-ac-kind-character { border-color:var(--anima-accent, #31515f); background:var(--anima-accent-wash, #0f1c24); color:var(--anima-text, #9bd7ef); }
.anima-ac-kind-artist { border-color:var(--anima-border-strong, #3a426a); background:var(--anima-panel-2, #151a2f); color:var(--anima-text-2, #b8c8ff); }
.anima-ac-works { font-size:9.5px; font-family:'JetBrains Mono',monospace; color:var(--anima-muted-2, #222230); white-space:nowrap; }

#anima-badge { position:absolute; background:var(--anima-panel, #10101a); border:1px solid var(--anima-border, #22223a); color:var(--anima-muted, #606080); font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:500; padding:3px 10px; border-radius:5px; pointer-events:none; white-space:nowrap; z-index:10001; display:none; }

#anima-swipe { --anima-radius:8px; --anima-control-radius:8px; --anima-control-height:30px; --anima-control-padding:6px 10px; --anima-select-padding:6px 24px 6px 10px; --anima-control-bg:var(--anima-surface, #10182b); --anima-control-border:var(--anima-border, #27304a); --anima-control-fg:var(--anima-text-2, #d8e5ff); --anima-control-muted-fg:var(--anima-muted, #9fb0d6); --anima-control-hover-bg:var(--anima-accent-soft, rgba(120,145,207,.22)); --anima-control-hover-border:var(--anima-accent, #7891cf); --anima-control-hover-fg:var(--anima-text, #eef3ff); --anima-font-ui:11px; --anima-font-small:10px; --anima-icon-size:30px; position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center; font-family:'Inter',sans-serif; }
#anima-swipe.hidden { display:none; }
#anima-swipe .backdrop { position:absolute; inset:0; background:var(--anima-backdrop, rgba(0,0,0,.86)); }
#anima-swipe .swipe-header { position:absolute; top:18px; left:0; width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0 20px; box-sizing:border-box; color:var(--anima-text, #e0e0f0); z-index:2; }
#anima-swipe .swipe-title { position:absolute; left:50%; max-width:min(58vw, 720px); transform:translateX(-50%); text-align:center; font-size:24px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#anima-swipe .swipe-counter { font-size:12px; font-family:'JetBrains Mono',monospace; background:var(--anima-panel, rgba(0,0,0,.4)); padding:6px 12px; border-radius:999px; border:1px solid var(--anima-border, #2a2a40); color:var(--anima-muted, #c0c0d0); user-select:none; }
#anima-swipe .swipe-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; min-width:0; }
#anima-swipe .swipe-favorite { display:inline-flex; align-items:center; justify-content:center; }
#anima-swipe .swipe-favorite.active { border-color:var(--anima-accent, #b99cff); }
#anima-swipe .swipe-favorite:disabled { opacity:.7; cursor:wait; transform:none; }
#anima-swipe .swipe-category { max-width:190px; outline:none; }
#anima-swipe .swipe-category:disabled { opacity:.7; cursor:wait; }
#anima-swipe .swipe-close { font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center; }
#anima-swipe .swipe-container { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; z-index:1; overflow:hidden; }
#anima-swipe .swipe-container.swipe-transition .swipe-image { transition:transform .2s ease, opacity .2s ease; }
#anima-swipe .swipe-image { max-height:85vh; max-width:85vw; object-fit:contain; border-radius:14px; }
#anima-swipe.favorited .swipe-image--current { outline:3px solid var(--anima-accent, #b99cff); outline-offset:3px; }
#anima-swipe.favorited .swipe-title::after { content:'Favorite'; display:inline-flex; align-items:center; margin-left:12px; padding:4px 8px; border-radius:999px; border:1px solid var(--anima-accent); background:var(--anima-accent-soft); color:var(--anima-text); font-size:10px; font-family:'JetBrains Mono',monospace; vertical-align:middle; }
#anima-swipe .swipe-image--current { transform:scale(1); opacity:1; z-index:3; cursor:pointer; }
#anima-swipe .swipe-image--prev, #anima-swipe .swipe-image--next { position:absolute; opacity:.42; z-index:2; cursor:pointer; }
#anima-swipe .swipe-image--prev { transform:scale(.8) translateX(-50vw); }
#anima-swipe .swipe-image--next { transform:scale(.8) translateX(50vw); }
#anima-swipe .swipe-hint { position:absolute; bottom:18px; z-index:2; font-size:12px; color:var(--anima-muted, #9090b0); background:var(--anima-panel, rgba(0,0,0,.35)); padding:6px 12px; border-radius:999px; border:1px solid var(--anima-border, #1a1a24); font-family:'JetBrains Mono',monospace; user-select:none; }
@media (max-width: 720px) {
    #anima-swipe .swipe-header { top:12px; gap:8px; padding:0 12px; }
    #anima-swipe .swipe-title { font-size:16px; }
    #anima-swipe .swipe-counter { padding:5px 8px; font-size:10px; }
    #anima-swipe .swipe-actions { gap:5px; }
    #anima-swipe .swipe-favorite { width:var(--anima-icon-size); min-width:var(--anima-icon-size); padding:0; overflow:hidden; color:transparent; }
    #anima-swipe .swipe-favorite::before { content:'★'; color:var(--anima-control-muted-fg); }
    #anima-swipe .swipe-favorite.active::before { color:var(--anima-text); }
    #anima-swipe .swipe-category { max-width:118px; }
}

.anima-fullet-auth { font-size:10px; font-family:'JetBrains Mono',monospace; color:var(--anima-muted); margin-right:6px; }
.anima-fullet-auth.connected { color:var(--anima-accent); }
#anima-fullet-upload.disabled { opacity:0.5; pointer-events:none; }

.anima-fullet-card { border-radius:10px; overflow:hidden; background:var(--anima-surface); border:1px solid var(--anima-border); display:flex; flex-direction:column; min-height:280px; transition:border-color .12s; }
.anima-fullet-card:hover { border-color:var(--anima-border-strong); }
.anima-fullet-card { min-height:unset; }
.anima-fullet-card.favorited { position:relative; border-color:var(--anima-accent); border-width:2px; box-shadow:inset 0 0 0 4px var(--anima-accent-ring); }
.anima-fullet-card.favorited .anima-fullet-mini[data-favorite='toggle'] { border-color:var(--anima-accent-hover); background:var(--anima-accent-soft); color:var(--anima-text); }
.anima-fullet-img { aspect-ratio:1.2; background:var(--anima-panel-2); position:relative; overflow:hidden; }
.anima-fullet-img img { width:100%; height:100%; object-fit:cover; display:block; }
.anima-fullet-img.no-img { display:flex; align-items:center; justify-content:center; }
.anima-fullet-img.no-img::after { content:attr(data-init); font-family:'JetBrains Mono',monospace; font-size:24px; color:var(--anima-muted-2); }
.anima-fullet-meta { display:flex; flex-direction:column; gap:5px; padding:10px 10px 11px; }
.anima-fullet-artist { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--anima-text-2); }
.anima-fullet-user { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--anima-muted); }
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
    text-decoration:none;
}

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
    border:1px solid var(--anima-border, #2a324d);
    background:var(--anima-panel, rgba(15, 20, 35, 0.96));
    color:var(--anima-text-2, #dbe5ff);
    font-size:11px;
    font-family:'Inter',sans-serif;
    box-shadow:var(--anima-shadow-sm, 0 8px 18px rgba(0,0,0,.34));
    opacity:0;
    transform:translateY(8px);
    transition:opacity .16s ease, transform .16s ease;
}
.anima-toast.show { opacity:1; transform:translateY(0); }
.anima-toast-success { border-color:var(--anima-success); background:var(--anima-panel); color:var(--anima-success); }
.anima-toast-error { border-color:var(--anima-danger); background:var(--anima-panel); color:var(--anima-danger); }
.anima-inline-toast {
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%, -46%) scale(.92);
    min-width:128px;
    max-width:calc(100% - 18px);
    padding:10px 14px;
    border-radius:999px;
    border:1px solid var(--anima-border, #2d3f63);
    background:var(--anima-panel, rgba(11, 16, 28, 0.9));
    color:var(--anima-text, #eef4ff);
    font-size:11px;
    font-family:'Inter',sans-serif;
    font-weight:600;
    letter-spacing:.01em;
    box-shadow:var(--anima-shadow-sm, 0 8px 18px rgba(0,0,0,.32));
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    opacity:0;
    transition:opacity .16s ease, transform .16s ease;
    pointer-events:none;
    z-index:5;
}
.anima-inline-toast.show { opacity:1; transform:translate(-50%, -50%) scale(1); }
.anima-inline-toast-success { border-color:var(--anima-success); background:var(--anima-panel); color:var(--anima-success); }
.anima-inline-toast-error { border-color:var(--anima-danger); background:var(--anima-panel); color:var(--anima-danger); }
.anima-upload-modal {
    position:absolute;
    inset:0;
    z-index:30;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
    background:var(--anima-modal-scrim, rgba(5, 8, 14, 0.78));
}
.anima-upload-modal.hidden { display:none; }
.anima-upload-panel {
    width:min(940px, 100%);
    max-height:100%;
    display:flex;
    flex-direction:column;
    border-radius:14px;
    border:1px solid var(--anima-border-strong);
    background:var(--anima-panel);
    box-shadow:var(--anima-shadow-lg, 0 14px 34px rgba(0,0,0,.34));
    overflow:hidden;
}
.anima-upload-header {
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:14px;
    padding:16px 18px 14px;
    border-bottom:1px solid var(--anima-border);
}
.anima-upload-copy { display:flex; flex-direction:column; gap:5px; }
.anima-upload-copy strong {
    font-size:14px;
    color:var(--anima-text);
    letter-spacing:.01em;
}
.anima-upload-copy span {
    max-width:560px;
    font-size:11px;
    line-height:1.5;
    color:var(--anima-muted);
}
.anima-upload-tools { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
.anima-upload-selection {
    min-width:72px;
    padding:6px 8px;
    border-radius:999px;
    border:1px solid var(--anima-border);
    background:var(--anima-surface);
    color:var(--anima-muted);
    font-size:10px;
    text-align:center;
    white-space:nowrap;
}
.anima-upload-options {
    display:grid;
    grid-template-columns:repeat(2, minmax(0, 1fr));
    gap:10px;
    padding:0 18px 14px;
    border-bottom:1px solid var(--anima-border);
}
.anima-upload-option {
    display:grid;
    grid-template-columns:auto 1fr;
    grid-template-rows:auto auto;
    column-gap:10px;
    row-gap:2px;
    align-items:center;
    padding:10px 12px;
    border:1px solid var(--anima-border);
    border-radius:10px;
    background:var(--anima-surface);
    cursor:pointer;
}
.anima-upload-option:hover {
    border-color:var(--anima-accent);
    background:var(--anima-accent-wash);
}
.anima-upload-option input {
    grid-row:1 / span 2;
    width:14px;
    height:14px;
    accent-color:var(--anima-accent);
}
.anima-upload-option-title {
    font-size:11px;
    font-weight:600;
    color:var(--anima-text);
}
.anima-upload-option small {
    color:var(--anima-muted);
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
    color:var(--anima-muted);
}
.anima-upload-empty strong {
    font-size:13px;
    color:var(--anima-text);
}
.anima-upload-empty span {
    max-width:460px;
    font-size:11px;
    line-height:1.5;
    color:var(--anima-muted);
}
.anima-upload-empty-loading strong,
.anima-upload-empty-loading span { color:var(--anima-muted); }
.anima-upload-card {
    display:flex;
    flex-direction:column;
    background:var(--anima-surface);
    border:1px solid var(--anima-border);
    border-radius:12px;
    overflow:hidden;
    transition:border-color .12s ease;
}
.anima-upload-card:hover {
    border-color:var(--anima-border-strong);
}
.anima-upload-card.selected {
    border-color:var(--anima-accent);
    outline:2px solid var(--anima-accent-ring);
    outline-offset:-2px;
}
.anima-upload-thumb {
    position:relative;
    aspect-ratio:1.08;
    background:var(--anima-panel-2);
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
    color:var(--anima-muted-2);
}
.anima-upload-badge {
    position:absolute;
    left:10px;
    top:10px;
    max-width:calc(100% - 20px);
    padding:5px 8px;
    border-radius:999px;
    background:var(--anima-panel);
    border:1px solid var(--anima-border);
    color:var(--anima-text-2);
    font-size:10px;
    font-family:'JetBrains Mono',monospace;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
}
.anima-upload-select {
    position:absolute;
    right:10px;
    top:10px;
    max-width:calc(100% - 20px);
    border-radius:999px;
    background:var(--anima-panel);
}
.anima-upload-select[aria-pressed="true"] {
    border-color:var(--anima-accent);
    background:var(--anima-accent-soft);
    color:var(--anima-text);
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
    color:var(--anima-text-2);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
}
.anima-upload-time {
    font-family:'JetBrains Mono',monospace;
    font-size:9px;
    color:var(--anima-muted);
    white-space:nowrap;
}
.anima-upload-prompt {
    min-height:46px;
    margin:0;
    color:var(--anima-muted);
    font-size:10px;
    line-height:1.45;
    display:-webkit-box;
    -webkit-line-clamp:3;
    -webkit-box-orient:vertical;
    overflow:hidden;
}
.anima-upload-action {
    width:100%;
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
    background:var(--anima-modal-scrim, rgba(5, 8, 14, 0.78));
}
.anima-key-modal.hidden { display:none; }
.anima-key-panel {
    width:min(640px, 100%);
    border-radius:14px;
    border:1px solid var(--anima-border-strong);
    background:var(--anima-panel);
    box-shadow:var(--anima-shadow-lg, 0 14px 34px rgba(0,0,0,.34));
    overflow:hidden;
}
.anima-key-header {
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:14px;
    padding:16px 18px 14px;
    border-bottom:1px solid var(--anima-border);
}
.anima-key-copy { display:flex; flex-direction:column; gap:5px; }
.anima-key-copy strong {
    font-size:14px;
    color:var(--anima-text);
    letter-spacing:.01em;
}
.anima-key-copy span {
    font-size:11px;
    line-height:1.55;
    color:var(--anima-muted);
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
    text-decoration:none;
}
.anima-key-field {
    display:flex;
    flex-direction:column;
    gap:6px;
}
.anima-key-field span {
    color:var(--anima-text-2);
    font-size:11px;
    font-weight:600;
}
.anima-key-field textarea {
    width:100%;
    resize:vertical;
    min-height:84px;
    padding:12px 14px;
    border-radius:12px;
    border:1px solid var(--anima-border);
    background:var(--anima-surface);
    color:var(--anima-text);
    font-family:'JetBrains Mono',monospace;
    font-size:11px;
    line-height:1.5;
    box-sizing:border-box;
}
.anima-key-actions {
    display:flex;
    justify-content:flex-end;
    padding:0 18px 18px;
}

`;
    document.head.appendChild(s);
}


