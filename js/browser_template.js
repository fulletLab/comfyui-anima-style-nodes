export function getBrowserTemplate(siteBase) {
    return `
            <div class="backdrop"></div>
            <div class="window">
                <div class="hdr">
                    <span class="hdr-title" style="margin-right:4px">Anima Style Explorer</span>
                    <div class="hdr-tabs">
                        <button class="anima-control hdr-btn-txt active" id="anima-cat-all" style="opacity:1;">All</button>
                        <button class="anima-control hdr-btn-txt" id="anima-cat-animadex-styles" style="opacity:0.5;">Animadex</button>
                        <button class="anima-control hdr-btn-txt" id="anima-cat-animadex-characters" style="opacity:0.5;">Characters</button>
                        <button class="anima-control hdr-btn-txt" id="anima-cat-generated" style="opacity:0.5;">Generated</button>
                        <button class="anima-control hdr-btn-txt" id="anima-cat-fullet" style="opacity:0.5;">Fullet</button>
                        <button class="anima-control hdr-btn-txt" id="anima-cat-favorites" style="opacity:0.5;">Favorites</button>
                    </div>
                    <div class="top-cycle-bar">
                        <span class="cycle-label">Cycle</span>
                        <button class="anima-control anima-control-icon anima-play-btn" id="anima-cycle-btn">
                            <span class="btn-icon" aria-hidden="true">▶️</span>
                            <span class="btn-lbl">Play</span>
                        </button>
                        <div class="cycle-settings-wrap">
                            <button class="anima-control anima-control-icon cycle-settings-btn" id="anima-cycle-settings" title="Auto Cycle settings" aria-label="Auto Cycle settings">&#9881;</button>
                            <div class="cycle-settings-panel hidden" id="anima-cycle-settings-panel">
                                <div class="cycle-settings-head">
                                    <div>
                                        <strong>Auto Cycle</strong>
                                        <span>Fill the generated gallery by cycling styles, characters, and image batches.</span>
                                    </div>
                                    <button type="button" class="anima-control anima-control-icon" id="anima-cycle-settings-close" title="Close">&#10005;</button>
                                </div>
                                <div class="cycle-settings-grid">
                                    <label class="cycle-control cycle-control-small">
                                        <span class="cycle-count-toggle">
                                            <input id="anima-cycle-enable-styles" type="checkbox" checked/>
                                            <span>Styles</span>
                                        </span>
                                        <div class="cycle-stepper">
                                            <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-artists" data-step-delta="-1" aria-label="Decrease artists">-</button>
                                            <input id="anima-cycle-artists" type="number" min="1" max="6" step="1" value="1"/>
                                            <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-artists" data-step-delta="1" aria-label="Increase artists">+</button>
                                        </div>
                                        <small>@style tags per cycle.</small>
                                    </label>
                                    <label class="cycle-control cycle-control-small cycle-control-character">
                                        <span class="cycle-count-toggle">
                                            <input id="anima-cycle-enable-characters" type="checkbox"/>
                                            <span>Characters</span>
                                        </span>
                                        <div class="cycle-character-controls">
                                            <div class="cycle-stepper">
                                                <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-characters" data-step-delta="-1" aria-label="Decrease characters">-</button>
                                                <input id="anima-cycle-characters" type="number" min="1" max="6" step="1" value="1"/>
                                                <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-characters" data-step-delta="1" aria-label="Increase characters">+</button>
                                            </div>
                                            <div class="cycle-character-mode-row">
                                                <select class="anima-control" id="anima-cycle-character-mode">
                                                    <option value="trigger">Trigger</option>
                                                    <option value="trigger-tags">Trigger + tags</option>
                                                </select>
                                            </div>
                                        </div>
                                        <small>Character groups per cycle.</small>
                                    </label>
                                    <label class="cycle-control cycle-control-small">
                                        <span>Images</span>
                                        <div class="cycle-stepper">
                                            <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-repeats" data-step-delta="-1" aria-label="Decrease images">-</button>
                                            <input id="anima-cycle-repeats" type="number" min="1" max="24" step="1" value="1"/>
                                            <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-repeats" data-step-delta="1" aria-label="Increase images">+</button>
                                        </div>
                                        <small>Images generated before choosing new tags.</small>
                                    </label>
                                    <label class="cycle-control">
                                        <span>Artist Pick</span>
                                        <select class="anima-control" id="anima-cycle-pick-mode">
                                            <option value="random-uniform">Random</option>
                                            <option value="random-weighted">Weighted Random</option>
                                            <option value="order">Card Order</option>
                                        </select>
                                        <small>Card Order follows the current gallery sort.</small>
                                    </label>
                                    <label class="cycle-control">
                                        <span>Skip Existing</span>
                                        <select class="anima-control" id="anima-cycle-record-basis">
                                            <option value="generated">Generated Gallery</option>
                                            <option value="cycle">Session Picks</option>
                                        </select>
                                        <small>Generated Gallery skips artists that already have previews.</small>
                                    </label>
                                    <label class="cycle-control cycle-control-small">
                                        <span>Stop After</span>
                                        <div class="cycle-stepper">
                                            <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-batch-count" data-step-delta="-1" aria-label="Decrease batch count">-</button>
                                            <input id="anima-cycle-batch-count" type="number" min="-1" step="1" value="20"/>
                                            <button type="button" class="anima-control anima-control-icon" data-step-target="anima-cycle-batch-count" data-step-delta="1" aria-label="Increase batch count">+</button>
                                        </div>
                                        <small>New artist picks before stop. Use -1 for unlimited.</small>
                                    </label>
                                    <label class="cycle-control cycle-control-range">
                                        <span>Works Range</span>
                                        <div class="cycle-range-inputs">
                                            <input id="anima-cycle-works-min" type="number" min="0" step="1" placeholder="Min"/>
                                            <span>to</span>
                                            <input id="anima-cycle-works-max" type="number" min="0" step="1" placeholder="Max"/>
                                        </div>
                                        <small>Leave blank for no limit.</small>
                                    </label>
                                    <div class="cycle-record-actions">
                                        <button type="button" class="anima-control" id="anima-cycle-clear-records">Reset Cycle History</button>
                                        <small>Clear session pick count and used artist history.</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <span class="anima-cycle-status" id="anima-cycle-status">stopped</span>
                    </div>
                    <div class="top-search-tools">
                        <button type="button" class="anima-control anima-control-icon hdr-btn top-search-toggle" id="anima-search-toggle" title="Search" aria-expanded="false">&#128269;</button>
                        <div class="cycle-search">
                            <i>@</i>
                            <input type="text" placeholder="Search..." autocomplete="off" spellcheck="false"/>
                        </div>
                        <select class="anima-control hdr-select anima-sort-select" title="Sort current tab">
                            <option value="works">Popular</option>
                            <option value="uniqueness">Unique</option>
                            <option value="name">A - Z</option>
                            <option value="latest">Latest</option>
                        </select>
                    </div>
                    <div class="hdr-gap"></div>
                    <span class="anima-fullet-auth" id="anima-fullet-auth">API key not set</span>
                    <button class="anima-control hdr-btn-txt" id="anima-fullet-connect">Set API Key</button>
                    <button class="anima-control hdr-btn-txt" id="anima-fullet-disconnect" style="display:none;">Remove Key</button>
                    <button class="anima-control hdr-btn-txt" id="anima-fullet-upload">Publish Collage</button>
                    <div class="hdr-data-btns">
                        <div class="hdr-settings-wrap" title="Tools">
                            <button class="anima-control anima-control-icon hdr-btn" id="anima-settings-gear" aria-label="Tools">&#9881;</button>
                            <div class="hdr-settings-menu">
                                <label class="hdr-settings-row hdr-settings-switch-row" for="anima-online-toggle" title="Enable internet access for remote preview images, including Animadex and Characters">
                                    <span>Remote Images</span>
                                    <span class="hdr-switch">
                                        <input type="checkbox" id="anima-online-toggle"/>
                                        <span class="hdr-slider"></span>
                                    </span>
                                </label>
                                <label class="hdr-settings-row hdr-settings-switch-row hdr-settings-option" for="anima-animadex-source" title="Also mix Animadex entries into All Styles. The Animadex tabs are always available when the index exists.">
                                    <span>Animadex in All</span>
                                    <span class="hdr-switch">
                                        <input type="checkbox" id="anima-animadex-source" />
                                        <span class="hdr-slider"></span>
                                    </span>
                                </label>
                                <div class="hdr-theme-colors" aria-label="Theme color settings">
                                    <span class="hdr-theme-colors-title">Theme Colors</span>
                                    <label class="hdr-settings-row hdr-settings-color-row" for="anima-theme-color" title="Customize the main background color">
                                        <span>Theme Color</span>
                                        <input type="color" id="anima-theme-color" aria-label="Theme background color" value="#0b0b0f" />
                                    </label>
                                    <label class="hdr-settings-row hdr-settings-color-row" for="anima-overlay-color" title="Customize the color mixed into panels and controls">
                                        <span>Overlay Color</span>
                                        <input type="color" id="anima-overlay-color" aria-label="Theme overlay color" value="#ffffff" />
                                    </label>
                                    <label class="hdr-settings-row hdr-settings-color-row" for="anima-highlight-color" title="Customize the highlight color">
                                        <span>Highlight Color</span>
                                        <input type="color" id="anima-highlight-color" aria-label="Theme highlight color" value="#7891cf" />
                                    </label>
                                </div>
                                <label class="hdr-settings-row hdr-settings-select-row" for="anima-grid-columns" title="Choose how many image cards appear per row">
                                    <span>Columns</span>
                                    <select class="anima-control" id="anima-grid-columns" aria-label="Images per row">
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                    </select>
                                </label>
                                <div class="hdr-settings-tabs hdr-settings-tabs-single">
                                    <span>Visible Tabs</span>
                                    <label class="hdr-tab-chip" for="anima-tab-visible-all">
                                        <span>All</span>
                                        <input type="checkbox" id="anima-tab-visible-all" data-tab-toggle="all" />
                                    </label>
                                    <label class="hdr-tab-chip" for="anima-tab-visible-animadex-styles">
                                        <span>Animadex</span>
                                        <input type="checkbox" id="anima-tab-visible-animadex-styles" data-tab-toggle="animadex-styles" />
                                    </label>
                                    <label class="hdr-tab-chip" for="anima-tab-visible-animadex-characters">
                                        <span>Characters</span>
                                        <input type="checkbox" id="anima-tab-visible-animadex-characters" data-tab-toggle="animadex-characters" />
                                    </label>
                                    <label class="hdr-tab-chip" for="anima-tab-visible-generated">
                                        <span>Generated</span>
                                        <input type="checkbox" id="anima-tab-visible-generated" data-tab-toggle="generated" />
                                    </label>
                                    <label class="hdr-tab-chip" for="anima-tab-visible-fullet">
                                        <span>Fullet</span>
                                        <input type="checkbox" id="anima-tab-visible-fullet" data-tab-toggle="fullet" />
                                    </label>
                                    <label class="hdr-tab-chip" for="anima-tab-visible-favorites">
                                        <span>Favorites</span>
                                        <input type="checkbox" id="anima-tab-visible-favorites" data-tab-toggle="favorites" />
                                    </label>
                                </div>
                                <div class="hdr-settings-actions">
                                    <button class="anima-control hdr-btn-txt hdr-settings-item" id="anima-generated-import-menu">Import Gallery</button>
                                    <button class="anima-control hdr-btn-txt hdr-settings-item" id="anima-generated-export-menu">Export Gallery</button>
                                </div>
                                <div class="hdr-settings-actions">
                                    <button class="anima-control hdr-btn-txt hdr-settings-item" id="anima-favorites-import-menu">Import Favorites</button>
                                    <button class="anima-control hdr-btn-txt hdr-settings-item" id="anima-favorites-export-menu">Export Favorites</button>
                                </div>
                                <div class="hdr-export-progress hidden" id="anima-generated-export-progress">
                                    <span id="anima-generated-export-label">Exporting...</span>
                                    <div><i id="anima-generated-export-bar"></i></div>
                                </div>
                                <input type="file" id="anima-generated-import-menu-file" accept=".json,.zip,application/json,application/zip" hidden/>
                                <input type="file" id="anima-favorites-import-menu-file" accept=".json,application/json" hidden/>
                                <div class="hdr-settings-actions">
                                    <button class="anima-control hdr-btn-txt hdr-settings-item" id="anima-update-styles">Update Styles</button>
                                    <button class="anima-control hdr-btn-txt hdr-settings-item" id="anima-dl-images">Download Previews</button>
                                </div>
                            </div>
                        </div>
                        <button class="anima-control anima-control-icon hdr-btn" id="anima-refresh" title="Refresh Styles">&#8635;</button>
                    </div>
                    <button class="anima-control anima-control-icon hdr-close" title="Close" style="margin-left:8px">&#10005;</button>
                </div>
                <div class="anima-prompt-panel">
                    <div class="anima-prompt-head">
                        <span class="anima-prompt-title">Prompt Preview</span>
                        <small id="anima-prompt-status">editable</small>
                        <label class="anima-prompt-subject">
                            <select class="anima-control hdr-select anima-prompt-select" id="anima-cycle-subject">
                                <option value="keep">Keep prompt</option>
                                <option value="1girl">1girl</option>
                                <option value="1boy">1boy</option>
                                <option value="2girls">2girls</option>
                                <option value="2boys">2boys</option>
                                <option value="1girl, 1boy">1girl + 1boy</option>
                            </select>
                        </label>
                    </div>
                    <textarea id="anima-prompt-editor" spellcheck="false" placeholder="Active prompt text will appear here..."></textarea>
                    <button type="button" class="anima-control anima-prompt-toggle" id="anima-prompt-toggle" title="Collapse Prompt Preview" aria-label="Collapse Prompt Preview" aria-expanded="true"></button>
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
                            <button class="anima-control anima-control-icon hdr-close" id="anima-key-close" title="Close">&#10005;</button>
                        </div>
                        <div class="anima-key-body">
                            <a class="anima-control anima-key-link" href="https://fullet.lat/ajustes/anima-key" target="_blank" rel="noopener">Open Fullet API key settings</a>
                            <label class="anima-key-field">
                                <span>Personal API Key</span>
                                <textarea id="anima-key-input" rows="3" placeholder="fanm_xxxxxxxx.xxxxxxxxxxxxxxxxxxxxx"></textarea>
                            </label>
                        </div>
                        <div class="anima-key-actions">
                            <button class="anima-control hdr-btn-txt" id="anima-key-save">Save Key</button>
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
                                <button class="anima-control hdr-btn-txt" id="anima-upload-selected" disabled>Publish Selected</button>
                                <button class="anima-control hdr-btn-txt" id="anima-upload-clear" disabled>Clear</button>
                                <button class="anima-control hdr-btn-txt" id="anima-upload-refresh">Refresh</button>
                                <button class="anima-control anima-control-icon hdr-close" id="anima-upload-close" title="Close">&#10005;</button>
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
                    <div class="anima-page-jump" id="anima-page-jump">
                        <span>Page</span>
                        <input id="anima-page-input" type="number" min="1" step="1" value="1"/>
                        <span id="anima-page-total">/ 1</span>
                        <button class="anima-control hdr-btn-txt" id="anima-page-go">Go</button>
                    </div>
                    <div class="ftr-gap"></div>
                    <div class="ftr-info-wrap">
                        <button class="anima-control ftr-info-btn" id="anima-footer-info">Info</button>
                        <div class="ftr-info-menu">
                            <span>Node created by <a class="anima-control" href="https://github.com/fulletLab" target="_blank" rel="noopener">fulletLab</a> and <a class="anima-control" href="https://github.com/Muruaaki" target="_blank" rel="noopener">Muruaaki</a></span>
                            <a class="anima-control" href="${siteBase}" target="_blank" rel="noopener">Anima assets -&gt;</a>
                            <a class="anima-control" href="https://animadex.net/?mode=artists" target="_blank" rel="noopener">Animadex styles -&gt;</a>
                            <a class="anima-control" href="https://animadex.net/?mode=characters" target="_blank" rel="noopener">Characters -&gt;</a>
                        </div>
                    </div>
                </div>
            </div>
    `;
}

