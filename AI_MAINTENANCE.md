# AI Maintenance Guide

This guide is for AI agents and maintainers working on this repository. Its main purpose is to keep UI, backend routes, data files, and tests aligned so the project does not accumulate invisible behavior surfaces.

## Project Shape

- `__init__.py` registers ComfyUI routes and exposes the web directory.
- `nodes.py` registers the `AnimaStyleExplorer` ComfyUI node. The frontend still depends on this node name, so do not remove it unless the UI mounting model is replaced too.
- `routes.py` wires route groups together.
- `routes_core.py` owns artist data, generated preview, update, and download endpoints.
- `routes_favorites.py` owns local favorites and favorite categories.
- `routes_fullet.py` owns Fullet auth, browsing, favorites, and upload endpoints.
- `js/` contains the ComfyUI frontend extension.
- `data/` contains large runtime datasets and local state. Treat it as data, not code.
- `tests/` contains Python route/storage tests and Node-based frontend source tests.

## Search Rules

When looking for unused UI or backend behavior, avoid searching large datasets unless the task is explicitly about data content.

Prefer:

```powershell
rg -n "pattern" -S --glob '!data/**' --glob '!__pycache__/**' .
```

The `data/artists.json` and `data/animadex_index.json` files are large and contain many tag names, URLs, and ordinary words such as `legacy`, `clear`, `api`, or `action`. Including them in broad searches creates noisy results that can hide the actual code entry points.

## Invisible Behavior Surface Checklist

Use this checklist when the UI has been removed or simplified:

- Search for stale backend routes in `routes_*.py`.
- Search for stale frontend calls to `api.fetchApi(...)`.
- Search for old CSS selectors in `js/styles.js`.
- Search for stale DOM IDs/classes in templates and tests.
- Search for legacy file readers or compatibility helpers that feed current responses.
- Search for node registration or extension mounting code before deleting ComfyUI node classes.
- Add a regression test that asserts the stale route, selector, or callback is absent.

## Backend Route Rules

Do not keep a backend endpoint just because it is harmless. If no current UI, workflow, or documented integration uses it, remove it or document why it remains.

Before deleting an endpoint:

1. Search for the route path in `js/`, `tests/`, `README.md`, and Python modules.
2. Check whether another route imports helper functions from the same module.
3. Remove route registration and any private helper used only by that route.
4. Add or update tests so the removed route is not registered.
5. Run the relevant Python tests.

Endpoints still used by the UI should remain even if they look internal. For example, Fullet local token and API key routes are used by the current frontend.

## Frontend Cleanup Rules

When removing UI:

- Remove the DOM markup from `js/browser_template.js` or the component file that creates it.
- Remove event handlers from `js/browser_events.js`, `js/browser.js`, or the relevant module.
- Remove CSS selectors from `js/styles.js`.
- Remove source callbacks and options that only existed for the removed UI.
- Add or update a source-level test under `tests/*.mjs` when practical.

Avoid leaving hidden buttons, disabled callbacks, or CSS for elements that can no longer render.

## UI Style Rules

The frontend uses `js/styles.js` as the single injected stylesheet. Keep same-kind controls on shared classes and variables instead of adding one-off button styles.

Shared control styling is based on:

- `.anima-control`
- `.anima-control-icon`
- `.anima-control-full`
- `--anima-control-bg`
- `--anima-control-border`
- `--anima-control-fg`
- `--anima-control-muted-fg`
- `--anima-control-hover-bg`
- `--anima-control-hover-border`
- `--anima-control-hover-fg`

Rules for new UI controls:

- Add `.anima-control` to actionable `button`, `select`, and `a` elements.
- Add `.anima-control-icon` for square icon-only controls.
- Add `.anima-control-full` for full-width action buttons.
- Keep component-specific classes only for layout, width, typography, or special semantic state.
- Do not recreate shared background, border, cursor, hover, or active styles on each component class.
- Do not use comma-list shared styling for component-specific selectors such as `.anima-card-pick` or `.anima-upload-action`; use the shared class on the element instead.
- If a control must be semantically different, such as a destructive action, make that difference explicit and test it.

Inputs and selects should use the shared control variables for visual color, border, radius, height, and padding. Avoid hard-coded control heights such as `26px`, `28px`, `29px`, `30px`, or `38px` unless the element is not a normal control surface.

`#anima-swipe` is outside `#anima-browser`, so it must define the shared control variables it needs locally.

## CSS Cleanup Rules

Before deleting CSS, prove whether the selector is actually unused.

Use a targeted search first:

```powershell
rg -n "selector-name|data-name|id-name" js tests --glob '!data/**'
```

Then check for dynamic class construction. These are expected and should not be removed just because a literal class name is not present:

- `anima-toast-${type}` produces `.anima-toast-success` and `.anima-toast-error`.
- `anima-inline-toast-${type}` produces `.anima-inline-toast-success` and `.anima-inline-toast-error`.
- `anima-ac-kind-${kind}` produces `.anima-ac-kind-artist` and `.anima-ac-kind-character`.
- `anima-card-source-${sourceKind}` produces `.anima-card-source-artist` and `.anima-card-source-character`.

Selectors that were removed as stale should stay absent unless the UI is deliberately reintroduced. `tests/test_unused_ui_cleanup.mjs` protects this.

If a UI entry point is unreachable, remove the whole chain:

- template or generated markup,
- event binding,
- callback parameter,
- helper used only by that entry point,
- CSS selector,
- tests that assumed the old hidden path existed.

The old generated-preview card edit path is an example: `editMode`, `data-remove-generated`, `onRemoveGenerated`, and `.anima-card-remove-generated` were removed because no current UI could enable them.

## Legacy Data Rules

Legacy compatibility should not silently affect current responses.

If an old data file is no longer part of the UI:

- Do not merge it into current API responses.
- Do not expose a compatibility route for it.
- Do not write to it from current actions.
- Keep attribution or source notes only when they still describe active data sources.

Current local favorites should use `data/favorites.json`. Old `custom_styles.json` compatibility should not be reintroduced unless there is an explicit migration requirement.

## ComfyUI Node Registration

Be careful with `nodes.py` and `NODE_CLASS_MAPPINGS`.

The frontend extension in `js/index.js` mounts behavior onto the `AnimaStyleExplorer` node. Removing the node mapping can remove the visible UI entry point, even if backend routes still exist.

Only remove the node registration when:

- there is a replacement frontend mounting strategy,
- old workflows no longer need to load the node,
- `js/index.js` no longer checks for `AnimaStyleExplorer`,
- tests or manual verification confirm the browser can still open.

## Verification

For route and storage changes:

```powershell
python -m pytest tests/test_routes_core.py tests/test_routes_favorites.py
```

For frontend source cleanup:

```powershell
npm run test:js
```

Frontend style cleanup should also keep these tests meaningful:

- `tests/test_shared_control_styles.mjs`
- `tests/test_unused_ui_cleanup.mjs`
- `tests/test_settings_menu_ui.mjs`

For broad cleanup work, run both. After verification, run a targeted search for the removed names or paths and confirm any remaining hits are only tests or documentation.

## Dirty Worktree Rule

This repository may already contain user edits. Do not revert unrelated files. Keep changes scoped to the behavior being removed or documented, and mention unrelated dirty files in the final summary if relevant.
