export function getBrowserTemplate(siteBase) {
    return `
            <div class="backdrop"></div>
            <div class="window">
                <div class="hdr">
                    <span class="hdr-title" style="margin-right:4px">Anima Style Explorer</span>
                    <div class="hdr-tabs">
                        <button class="hdr-btn-txt active" id="anima-cat-all" style="opacity:1;">All Styles</button>
                        <button class="hdr-btn-txt" id="anima-cat-animadex-styles" style="opacity:0.5;">Animadex Styles</button>
                        <button class="hdr-btn-txt" id="anima-cat-animadex-characters" style="opacity:0.5;">Characters</button>
                        <button class="hdr-btn-txt" id="anima-cat-fullet" style="opacity:0.5;">Fullet Prompts</button>
                        <button class="hdr-btn-txt" id="anima-cat-favorites" style="opacity:0.5;">Favorites</button>
                    </div>
                    <select class="hdr-select" style="margin-left:8px">
                        <option value="works">Popularity</option>
                        <option value="uniqueness">Uniqueness</option>
                        <option value="name">A - Z</option>
                    </select>
                    <div class="hdr-gap"></div>
                    <span class="anima-fullet-auth" id="anima-fullet-auth">API key not set</span>
                    <button class="hdr-btn-txt" id="anima-fullet-connect">Set API Key</button>
                    <button class="hdr-btn-txt" id="anima-fullet-disconnect" style="display:none;">Remove Key</button>
                    <button class="hdr-btn-txt" id="anima-fullet-upload">Publish Collage</button>
                    <div class="hdr-data-btns">
                        <div class="hdr-toggle-wrap" title="Enable internet access for remote preview images, including Animadex Styles and Characters">
                            <span class="hdr-toggle-label">Remote Images</span>
                            <label class="hdr-switch">
                                <input type="checkbox" id="anima-online-toggle"/>
                                <span class="hdr-slider"></span>
                            </label>
                        </div>
                        <div class="hdr-settings-wrap" title="Tools">
                            <button class="hdr-btn" id="anima-settings-gear" aria-label="Tools">&#9881;</button>
                            <div class="hdr-settings-menu">
                                <label class="hdr-settings-option" for="anima-keep-session">
                                    <input type="checkbox" id="anima-keep-session" />
                                    <span>Keep key after restart</span>
                                </label>
                                <label class="hdr-settings-option" for="anima-animadex-source" title="Also mix Animadex entries into All Styles. The Animadex tabs are always available when the index exists.">
                                    <input type="checkbox" id="anima-animadex-source" />
                                    <span>Show Animadex in All Styles</span>
                                </label>
                                <button class="hdr-btn-txt hdr-settings-item" id="anima-update-styles">Update Styles</button>
                                <button class="hdr-btn-txt hdr-settings-item" id="anima-dl-images">Download Previews</button>
                            </div>
                        </div>
                        <button class="hdr-btn" id="anima-refresh" title="Refresh Styles">&#8635;</button>
                    </div>
                    <button class="hdr-close" title="Close" style="margin-left:8px">&#10005;</button>
                </div>
                <div class="cycle-bar">
                    <span class="cycle-label">Auto Cycle</span>
                    <button class="anima-play-btn" id="anima-cycle-btn">
                        <span class="btn-icon">&#9654;</span>
                        <span class="btn-lbl">Play</span>
                    </button>
                    <div class="cycle-settings-wrap">
                        <button class="cycle-settings-btn" id="anima-cycle-settings" title="Auto Cycle settings" aria-label="Auto Cycle settings">&#9881;</button>
                        <div class="cycle-settings-panel hidden" id="anima-cycle-settings-panel">
                            <div class="cycle-settings-head">
                                <div>
                                    <strong>Auto Cycle Settings</strong>
                                    <span>Choose what rotates when Play queues the next prompt.</span>
                                </div>
                                <button type="button" id="anima-cycle-settings-close" title="Close">&#10005;</button>
                            </div>
                            <div class="cycle-settings-grid">
                                <label class="cycle-control">
                                    <span>Rotate</span>
                                    <select id="anima-cycle-source">
                                        <option value="styles">Styles only</option>
                                        <option value="characters">Characters only</option>
                                        <option value="all">Styles + Characters</option>
                                    </select>
                                </label>
                                <label class="cycle-control">
                                    <span>Character Insert</span>
                                    <select id="anima-cycle-character-mode">
                                        <option value="trigger">Trigger</option>
                                        <option value="trigger-tags">Trigger + tags</option>
                                    </select>
                                </label>
                                <label class="cycle-control cycle-control-small">
                                    <span>Artists</span>
                                    <div class="cycle-stepper">
                                        <button type="button" data-step-target="anima-cycle-artists" data-step-delta="-1" aria-label="Decrease artists">-</button>
                                        <input id="anima-cycle-artists" type="number" min="1" max="6" step="1" value="1"/>
                                        <button type="button" data-step-target="anima-cycle-artists" data-step-delta="1" aria-label="Increase artists">+</button>
                                    </div>
                                    <small>How many @style tags per cycle.</small>
                                </label>
                                <label class="cycle-control cycle-control-small">
                                    <span>Characters</span>
                                    <div class="cycle-stepper">
                                        <button type="button" data-step-target="anima-cycle-characters" data-step-delta="-1" aria-label="Decrease characters">-</button>
                                        <input id="anima-cycle-characters" type="number" min="1" max="6" step="1" value="1"/>
                                        <button type="button" data-step-target="anima-cycle-characters" data-step-delta="1" aria-label="Increase characters">+</button>
                                    </div>
                                    <small>How many character groups per cycle.</small>
                                </label>
                                <label class="cycle-control">
                                    <span>Subject Tag</span>
                                    <select id="anima-cycle-subject">
                                        <option value="keep">Keep prompt</option>
                                        <option value="1girl">1girl</option>
                                        <option value="1boy">1boy</option>
                                        <option value="2girls">2girls</option>
                                        <option value="2boys">2boys</option>
                                        <option value="1girl, 1boy">1girl + 1boy</option>
                                    </select>
                                </label>
                                <label class="cycle-control cycle-control-small">
                                    <span>Images</span>
                                    <div class="cycle-stepper">
                                        <button type="button" data-step-target="anima-cycle-repeats" data-step-delta="-1" aria-label="Decrease images">-</button>
                                        <input id="anima-cycle-repeats" type="number" min="1" max="24" step="1" value="1"/>
                                        <button type="button" data-step-target="anima-cycle-repeats" data-step-delta="1" aria-label="Increase images">+</button>
                                    </div>
                                    <small>Queue count before picking new tags.</small>
                                </label>
                                <label class="cycle-control">
                                    <span>Random</span>
                                    <select id="anima-cycle-random">
                                        <option value="uniform">Uniform</option>
                                        <option value="weighted">By image count</option>
                                    </select>
                                </label>
                                <label class="cycle-check">
                                    <input id="anima-cycle-resume" type="checkbox"/>
                                    <span>Resume after stop</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <span class="anima-cycle-status" id="anima-cycle-status">stopped</span>
                    <button class="anima-swipe-btn" id="anima-swipe-btn" title="Swipe through styles one by one">Swipe Mode</button>
                    <div class="cycle-search">
                        <i>@</i>
                        <input type="text" placeholder="Search artists or prompts..." autocomplete="off" spellcheck="false"/>
                    </div>
                    <div class="cycle-gap"></div>
                    <span class="cycle-hint">Automatically queues prompts to test styles in a continuous loop</span>
                </div>
                <div class="anima-prompt-panel">
                    <div class="anima-prompt-head">
                        <span>Prompt Preview</span>
                        <small id="anima-prompt-status">editable</small>
                    </div>
                    <textarea id="anima-prompt-editor" spellcheck="false" placeholder="Active prompt text will appear here..."></textarea>
                </div>
                <div class="body">
                    <div class="anima-grid" id="anima-grid">
                        <div class="anima-empty"><div class="anima-spinner"></div><span>Loading styles...</span></div>
                    </div>
                </div>
                <div class="anima-key-modal hidden" id="anima-key-modal">
                    <div class="anima-key-panel" id="anima-key-panel">
                        <div class="anima-key-header">
                            <div class="anima-key-copy">
                                <strong>Set Fullet API Key</strong>
                                <span>Generate a Personal API Key in your Fullet account settings, then paste it here. The key stays on this machine and is only sent to Fullet.</span>
                            </div>
                            <button class="hdr-close" id="anima-key-close" title="Close">&#10005;</button>
                        </div>
                        <div class="anima-key-body">
                            <a class="anima-key-link" href="https://fullet.lat/ajustes/anima-key" target="_blank" rel="noopener">Open Fullet API key settings</a>
                            <label class="anima-key-field">
                                <span>Personal API Key</span>
                                <textarea id="anima-key-input" rows="3" placeholder="fanm_xxxxxxxx.xxxxxxxxxxxxxxxxxxxxx"></textarea>
                            </label>
                            <p class="anima-key-hint">Tip: leave "Keep key after restart" off if you only want it for this ComfyUI session.</p>
                        </div>
                        <div class="anima-key-actions">
                            <button class="hdr-btn-txt" id="anima-key-save">Save Key</button>
                        </div>
                    </div>
                </div>
                <div class="anima-upload-modal hidden" id="anima-upload-modal">
                    <div class="anima-upload-panel" id="anima-upload-panel">
                        <div class="anima-upload-header">
                            <div class="anima-upload-copy">
                                <strong>Recent Anima Generations</strong>
                                <span>Select one image for a normal post, or select several @artist outputs to publish a style collage with comparison notes.</span>
                            </div>
                            <div class="anima-upload-tools">
                                <span class="anima-upload-selection" id="anima-upload-selection">0 selected</span>
                                <button class="hdr-btn-txt" id="anima-upload-selected" disabled>Publish Selected</button>
                                <button class="hdr-btn-txt" id="anima-upload-clear" disabled>Clear</button>
                                <button class="hdr-btn-txt" id="anima-upload-refresh">Refresh</button>
                                <button class="hdr-close" id="anima-upload-close" title="Close">&#10005;</button>
                            </div>
                        </div>
                        <div class="anima-upload-options">
                            <label class="anima-upload-option" for="anima-upload-nsfw">
                                <input type="checkbox" id="anima-upload-nsfw" />
                                <span class="anima-upload-option-title">Mark as NSFW</span>
                                <small>Publish this generation as adult content.</small>
                            </label>
                            <label class="anima-upload-option" for="anima-upload-preserve">
                                <input type="checkbox" id="anima-upload-preserve" checked />
                                <span class="anima-upload-option-title">Preserve metadata</span>
                                <small>Keep prompt, negative prompt, and extracted ComfyUI settings.</small>
                            </label>
                        </div>
                        <div class="anima-upload-body">
                            <div class="anima-upload-grid" id="anima-upload-grid"></div>
                        </div>
                    </div>
                </div>
                <div class="ftr">
                    <span class="ftr-count" id="anima-count"></span>
                    <span class="ftr-count"> | </span>
                    <span class="ftr-count">Node created by <a href="https://github.com/fulletLab" target="_blank" style="color:#d0d0e0;text-decoration:none;font-weight:600">fulletLab</a></span>
                    <div class="ftr-gap"></div>
                    <a class="ftr-link" href="${siteBase}" target="_blank" rel="noopener">Anima assets -&gt;</a>
                    <a class="ftr-link" href="https://animadex.net/?mode=artists" target="_blank" rel="noopener">Animadex styles -&gt;</a>
                    <a class="ftr-link" href="https://animadex.net/?mode=characters" target="_blank" rel="noopener">Characters -&gt;</a>
                </div>
            </div>
    `;
}

