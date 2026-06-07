import json
import os
import threading
from datetime import datetime, timezone

from aiohttp import web

BASE_DIR = os.path.dirname(__file__)
LOCAL_FAVORITES_FILE = os.path.join(BASE_DIR, "data", "favorites.json")
MAX_LOCAL_FAVORITES = int(os.getenv("ANIMA_MAX_LOCAL_FAVORITES", "-1"))

_favorites_lock = threading.Lock()


def _safe_json_load(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _safe_json_save(path, data):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f" [AnimaStyleExplorer] Failed to persist favorites file: {e}")


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def normalize_fullet_post(item):
    if not isinstance(item, dict):
        return None

    artist = str(item.get("artist") or "").strip().replace("@", "")
    prompt = str(item.get("prompt") or "").strip()
    if not artist or not prompt:
        return None

    return {
        "id": str(item.get("id") or ""),
        "username": str(item.get("username") or ""),
        "prompt": prompt,
        "artist": artist,
        "imageUrl": str(item.get("imageUrl") or ""),
        "thumbnailUrl": str(item.get("thumbnailUrl") or ""),
        "createdAt": str(item.get("createdAt") or ""),
        "postUrl": str(item.get("postUrl") or ""),
    }


def _favorite_key_for_item(item):
    if not isinstance(item, dict):
        return ""

    kind = str(item.get("kind") or "").strip().lower()
    if kind == "style":
        tag = str(item.get("tag") or "").strip().replace(" ", "_").lower()
        return f"style:{tag}" if tag else ""

    if kind == "fullet":
        post_id = str(item.get("id") or item.get("postId") or "").strip()
        return f"fullet:{post_id}" if post_id else ""

    return ""


def _normalize_local_favorite(item):
    if not isinstance(item, dict):
        return None

    key = _favorite_key_for_item(item)
    if not key:
        return None

    kind = "style" if key.startswith("style:") else "fullet"
    added_at = str(item.get("addedAt") or item.get("createdAt") or _now_iso())

    if kind == "style":
        tag = str(item.get("tag") or "").strip().replace(" ", "_")
        if not tag:
            return None
        return {
            "key": key,
            "kind": "style",
            "tag": tag,
            "id": str(item.get("id") or "").strip(),
            "p": max(1, int(item.get("p") or 1)),
            "works": int(item.get("works") or 0),
            "uniqueness_score": float(item.get("uniqueness_score") or 0),
            "name": str(item.get("name") or "").strip(),
            "source": str(item.get("source") or "").strip(),
            "source_kind": str(item.get("source_kind") or "").strip(),
            "slug": str(item.get("slug") or "").strip(),
            "thumb_url": str(item.get("thumb_url") or "").strip(),
            "img_url": str(item.get("img_url") or "").strip(),
            "localPreviewCached": bool(item.get("localPreviewCached") or False),
            "addedAt": added_at,
        }

    normalized_post = normalize_fullet_post({
        "id": str(item.get("id") or item.get("postId") or "").strip(),
        "username": str(item.get("username") or "").strip(),
        "prompt": str(item.get("prompt") or "").strip(),
        "artist": str(item.get("artist") or "").strip(),
        "imageUrl": str(item.get("imageUrl") or "").strip(),
        "thumbnailUrl": str(item.get("thumbnailUrl") or "").strip(),
        "createdAt": str(item.get("createdAt") or "").strip(),
        "postUrl": str(item.get("postUrl") or "").strip(),
    })
    if not normalized_post:
        return None

    return {
        "key": key,
        "kind": "fullet",
        **normalized_post,
        "addedAt": added_at,
    }


def _read_local_favorites_locked():
    raw = _safe_json_load(LOCAL_FAVORITES_FILE)
    source_items = []

    if isinstance(raw, dict):
        if isinstance(raw.get("items"), list):
            source_items = raw.get("items")
        elif isinstance(raw.get("favorites"), list):
            source_items = raw.get("favorites")
    elif isinstance(raw, list):
        source_items = raw

    normalized = []
    seen = set()
    for item in source_items:
        entry = _normalize_local_favorite(item)
        if not entry:
            continue
        key = entry.get("key")
        if not key or key in seen:
            continue
        seen.add(key)
        normalized.append(entry)

    return normalized


def _write_local_favorites_locked(items):
    payload = {
        "items": items,
        "updatedAt": _now_iso(),
    }
    _safe_json_save(LOCAL_FAVORITES_FILE, payload)


def list_local_favorites():
    with _favorites_lock:
        return _read_local_favorites_locked()


def _has_local_favorite(key):
    target = str(key or "").strip()
    if not target:
        return False

    with _favorites_lock:
        items = _read_local_favorites_locked()
        return any(str(item.get("key") or "") == target for item in items)


def _upsert_local_favorite(item):
    entry = _normalize_local_favorite(item)
    if not entry:
        return None

    with _favorites_lock:
        items = _read_local_favorites_locked()
        items = [x for x in items if str(x.get("key") or "") != entry.get("key")]
        items.append(entry)
        if MAX_LOCAL_FAVORITES > 0 and len(items) > MAX_LOCAL_FAVORITES:
            items = items[-MAX_LOCAL_FAVORITES:]
        _write_local_favorites_locked(items)
    return entry


def _remove_local_favorite(key="", item=None):
    target = str(key or "").strip() or _favorite_key_for_item(item or {})
    if not target:
        return False

    with _favorites_lock:
        items = _read_local_favorites_locked()
        kept = [x for x in items if str(x.get("key") or "") != target]
        changed = len(kept) != len(items)
        if changed:
            _write_local_favorites_locked(kept)
    return changed


def _get_legacy_custom_style_tags():
    tags = []
    try:
        custom_path = os.path.join(BASE_DIR, "data", "custom_styles.json")
        if os.path.exists(custom_path):
            with open(custom_path, "r", encoding="utf-8") as f:
                payload = json.load(f)
                if isinstance(payload, list):
                    tags = [str(x or "").strip().replace(" ", "_") for x in payload if str(x or "").strip()]
    except Exception as e:
        print(f" [AnimaStyleExplorer] Error reading legacy custom styles: {e}")
    return tags


def list_style_favorites():
    tags = set(_get_legacy_custom_style_tags())
    for item in list_local_favorites():
        if str(item.get("kind") or "") == "style":
            tag = str(item.get("tag") or "").strip().replace(" ", "_")
            if tag:
                tags.add(tag)
    return sorted(tags)


def export_favorites_payload():
    return {
        "animaFavoritesVersion": 1,
        "exportedAt": _now_iso(),
        "items": list_local_favorites(),
    }


def import_favorites_payload(payload):
    raw_items = payload.get("items") if isinstance(payload, dict) else []
    if not isinstance(raw_items, list):
        raw_items = []

    imported = 0
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        if _upsert_local_favorite(item):
            imported += 1
    return {"ok": True, "imported": imported, "items": list_local_favorites()}


def register_favorite_routes(server, require_local_token):
    @server.instance.routes.get("/anima/custom_styles")
    async def get_custom_styles(request):
        return web.json_response(list_style_favorites())

    @server.instance.routes.get("/anima/favorites")
    async def get_favorites(request):
        return web.json_response({"items": list_local_favorites()})

    @server.instance.routes.get("/anima/favorites/export")
    async def export_favorites(request):
        return web.json_response(export_favorites_payload())

    @server.instance.routes.post("/anima/favorites")
    async def mutate_favorites(request):
        denied = require_local_token(request)
        if denied is not None:
            return denied

        try:
            body = await request.json()
        except Exception:
            body = {}

        if not isinstance(body, dict):
            body = {}

        action = str(body.get("action") or "upsert").strip().lower()
        item = body.get("item") if isinstance(body.get("item"), dict) else {}

        if action == "clear":
            with _favorites_lock:
                _write_local_favorites_locked([])
            return web.json_response({"ok": True, "items": []})

        if action == "import":
            return web.json_response(import_favorites_payload(body))

        if action == "remove":
            changed = _remove_local_favorite(key=str(body.get("key") or ""), item=item)
            return web.json_response({"ok": True, "removed": changed, "items": list_local_favorites()})

        if action == "toggle":
            key = _favorite_key_for_item(item)
            if not key:
                return web.json_response({"error": "Invalid favorite payload"}, status=400)

            if _has_local_favorite(key):
                _remove_local_favorite(key=key)
                return web.json_response({"ok": True, "favorited": False, "items": list_local_favorites()})

            entry = _upsert_local_favorite(item)
            if not entry:
                return web.json_response({"error": "Invalid favorite payload"}, status=400)
            return web.json_response({"ok": True, "favorited": True, "item": entry, "items": list_local_favorites()})

        entry = _upsert_local_favorite(item)
        if not entry:
            return web.json_response({"error": "Invalid favorite payload"}, status=400)

        return web.json_response({"ok": True, "item": entry, "items": list_local_favorites()})
