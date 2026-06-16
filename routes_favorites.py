import json
import os
import threading
from datetime import datetime, timezone

from aiohttp import web

BASE_DIR = os.path.dirname(__file__)
LOCAL_FAVORITES_FILE = os.path.join(BASE_DIR, "data", "favorites.json")
MAX_LOCAL_FAVORITES = int(os.getenv("ANIMA_MAX_LOCAL_FAVORITES", "-1"))
MAX_FAVORITE_CATEGORY_NAME_LENGTH = 80

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


def _normalize_category_name(value):
    name = str(value or "").strip()
    if not name:
        return ""
    return " ".join(name.split())[:MAX_FAVORITE_CATEGORY_NAME_LENGTH]


def _normalize_favorite_category(item):
    if isinstance(item, str):
        name = _normalize_category_name(item)
        if not name:
            return None
        return {
            "name": name,
            "createdAt": _now_iso(),
            "updatedAt": _now_iso(),
        }

    if not isinstance(item, dict):
        return None

    name = _normalize_category_name(item.get("name"))
    if not name:
        return None

    return {
        "name": name,
        "createdAt": str(item.get("createdAt") or _now_iso()),
        "updatedAt": str(item.get("updatedAt") or item.get("createdAt") or _now_iso()),
    }


def _normalize_favorite_categories(raw):
    source_items = raw if isinstance(raw, list) else []
    normalized = []
    seen = set()
    for item in source_items:
        entry = _normalize_favorite_category(item)
        if not entry:
            continue
        key = entry["name"].casefold()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(entry)
    return normalized


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
    category = _normalize_category_name(item.get("category"))

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
            "category": category,
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
        "category": category,
        "addedAt": added_at,
    }


def _read_local_favorites_payload_locked():
    raw = _safe_json_load(LOCAL_FAVORITES_FILE)
    source_items = []
    categories = []

    if isinstance(raw, dict):
        if isinstance(raw.get("items"), list):
            source_items = raw.get("items")
        elif isinstance(raw.get("favorites"), list):
            source_items = raw.get("favorites")
        categories = _normalize_favorite_categories(raw.get("categories"))
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

    category_names = {str(category.get("name") or "").casefold() for category in categories}
    for item in normalized:
        category = _normalize_category_name(item.get("category"))
        if category and category.casefold() not in category_names:
            categories.append({
                "name": category,
                "createdAt": str(item.get("addedAt") or _now_iso()),
                "updatedAt": str(item.get("addedAt") or _now_iso()),
            })
            category_names.add(category.casefold())

    return {"items": normalized, "categories": categories}


def _read_local_favorites_locked():
    return _read_local_favorites_payload_locked()["items"]


def _read_local_categories_locked():
    return _read_local_favorites_payload_locked()["categories"]


def _write_local_favorites_payload_locked(items, categories=None):
    if categories is None:
        categories = _read_local_categories_locked()
    category_names = {str(category.get("name") or "").casefold() for category in categories}
    for item in items:
        category = _normalize_category_name(item.get("category"))
        if category and category.casefold() not in category_names:
            categories.append({
                "name": category,
                "createdAt": str(item.get("addedAt") or _now_iso()),
                "updatedAt": str(item.get("addedAt") or _now_iso()),
            })
            category_names.add(category.casefold())

    payload = {
        "items": items,
        "categories": categories,
        "updatedAt": _now_iso(),
    }
    _safe_json_save(LOCAL_FAVORITES_FILE, payload)


def _write_local_favorites_locked(items):
    _write_local_favorites_payload_locked(items)


def _favorite_snapshot_locked():
    return _read_local_favorites_payload_locked()


def _find_category(categories, name):
    target = _normalize_category_name(name).casefold()
    if not target:
        return None
    for category in categories:
        if str(category.get("name") or "").casefold() == target:
            return category
    return None


def _upsert_favorite_category_locked(name):
    category_name = _normalize_category_name(name)
    if not category_name:
        return None

    snapshot = _read_local_favorites_payload_locked()
    categories = snapshot["categories"]
    existing = _find_category(categories, category_name)
    if existing:
        existing["name"] = category_name
        existing["updatedAt"] = _now_iso()
    else:
        existing = {
            "name": category_name,
            "createdAt": _now_iso(),
            "updatedAt": _now_iso(),
        }
        categories.append(existing)
    _write_local_favorites_payload_locked(snapshot["items"], categories)
    return existing


def list_favorite_categories():
    with _favorites_lock:
        return _read_local_categories_locked()


def upsert_favorite_category(name):
    with _favorites_lock:
        return _upsert_favorite_category_locked(name)


def rename_favorite_category(old_name, new_name):
    old_name = _normalize_category_name(old_name)
    new_name = _normalize_category_name(new_name)
    if not old_name or not new_name:
        return {"ok": False, "error": "Invalid category name"}

    with _favorites_lock:
        snapshot = _read_local_favorites_payload_locked()
        categories = [x for x in snapshot["categories"] if str(x.get("name") or "").casefold() != old_name.casefold()]
        existing = _find_category(categories, new_name)
        if existing:
            existing["updatedAt"] = _now_iso()
        else:
            categories.append({
                "name": new_name,
                "createdAt": _now_iso(),
                "updatedAt": _now_iso(),
            })
        items = []
        for item in snapshot["items"]:
            if _normalize_category_name(item.get("category")).casefold() == old_name.casefold():
                item = {**item, "category": new_name}
            items.append(item)
        _write_local_favorites_payload_locked(items, categories)
        return {"ok": True, **_favorite_snapshot_locked()}


def delete_favorite_category(name):
    name = _normalize_category_name(name)
    if not name:
        return {"ok": False, "error": "Invalid category name"}

    with _favorites_lock:
        snapshot = _read_local_favorites_payload_locked()
        categories = [x for x in snapshot["categories"] if str(x.get("name") or "").casefold() != name.casefold()]
        items = []
        for item in snapshot["items"]:
            if _normalize_category_name(item.get("category")).casefold() == name.casefold():
                item = {**item, "category": ""}
            items.append(item)
        _write_local_favorites_payload_locked(items, categories)
        return {"ok": True, **_favorite_snapshot_locked()}


def batch_assign_favorite_category(items, category):
    if not isinstance(items, list):
        items = []
    category_name = _normalize_category_name(category)

    with _favorites_lock:
        snapshot = _read_local_favorites_payload_locked()
        existing_by_key = {str(item.get("key") or ""): item for item in snapshot["items"]}
        changed = 0

        if category_name:
            _upsert_favorite_category_locked(category_name)
            snapshot = _read_local_favorites_payload_locked()
            existing_by_key = {str(item.get("key") or ""): item for item in snapshot["items"]}

        for item in items:
            if not isinstance(item, dict):
                continue
            key = _favorite_key_for_item(item)
            if not key:
                continue
            merged = {
                **existing_by_key.get(key, {}),
                **item,
                "category": category_name,
            }
            entry = _normalize_local_favorite(merged)
            if not entry:
                continue
            existing_by_key[key] = entry
            changed += 1

        next_items = list(existing_by_key.values())
        if MAX_LOCAL_FAVORITES > 0 and len(next_items) > MAX_LOCAL_FAVORITES:
            next_items = next_items[-MAX_LOCAL_FAVORITES:]
        categories = _read_local_categories_locked()
        _write_local_favorites_payload_locked(next_items, categories)
        return {"ok": True, "changed": changed, **_favorite_snapshot_locked()}


def list_local_favorites_payload():
    with _favorites_lock:
        return _favorite_snapshot_locked()


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


def list_style_favorites():
    tags = set()
    for item in list_local_favorites():
        if str(item.get("kind") or "") == "style":
            tag = str(item.get("tag") or "").strip().replace(" ", "_")
            if tag:
                tags.add(tag)
    return sorted(tags)


def export_favorites_payload():
    snapshot = list_local_favorites_payload()
    return {
        "animaFavoritesVersion": 1,
        "exportedAt": _now_iso(),
        "items": snapshot["items"],
        "categories": snapshot["categories"],
    }


def import_favorites_payload(payload):
    raw_items = payload.get("items") if isinstance(payload, dict) else []
    if not isinstance(raw_items, list):
        raw_items = []

    raw_categories = payload.get("categories") if isinstance(payload, dict) else []
    imported = 0
    with _favorites_lock:
        snapshot = _read_local_favorites_payload_locked()
        categories = snapshot["categories"]
        category_names = {str(category.get("name") or "").casefold() for category in categories}
        for category in _normalize_favorite_categories(raw_categories):
            key = category["name"].casefold()
            if key in category_names:
                continue
            categories.append(category)
            category_names.add(key)

        items = snapshot["items"]
        by_key = {str(item.get("key") or ""): item for item in items}
        for item in raw_items:
            if not isinstance(item, dict):
                continue
            entry = _normalize_local_favorite(item)
            if not entry:
                continue
            by_key[entry["key"]] = entry
            imported += 1
        _write_local_favorites_payload_locked(list(by_key.values()), categories)
        snapshot = _favorite_snapshot_locked()
    return {"ok": True, "imported": imported, **snapshot}


def register_favorite_routes(server, require_local_token):
    @server.instance.routes.get("/anima/favorites")
    async def get_favorites(request):
        return web.json_response(list_local_favorites_payload())

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
                _write_local_favorites_payload_locked([], [])
            return web.json_response({"ok": True, "items": [], "categories": []})

        if action == "import":
            return web.json_response(import_favorites_payload(body))

        if action == "category_upsert":
            entry = upsert_favorite_category(body.get("name"))
            if not entry:
                return web.json_response({"error": "Invalid category name"}, status=400)
            return web.json_response({"ok": True, "category": entry, **list_local_favorites_payload()})

        if action == "category_rename":
            result = rename_favorite_category(body.get("oldName"), body.get("newName"))
            if not result.get("ok"):
                return web.json_response({"error": result.get("error") or "Invalid category name"}, status=400)
            return web.json_response(result)

        if action == "category_delete":
            result = delete_favorite_category(body.get("name"))
            if not result.get("ok"):
                return web.json_response({"error": result.get("error") or "Invalid category name"}, status=400)
            return web.json_response(result)

        if action == "batch_assign":
            return web.json_response(batch_assign_favorite_category(
                body.get("items") if isinstance(body.get("items"), list) else [],
                body.get("category"),
            ))

        if action == "remove":
            changed = _remove_local_favorite(key=str(body.get("key") or ""), item=item)
            return web.json_response({"ok": True, "removed": changed, **list_local_favorites_payload()})

        if action == "toggle":
            key = _favorite_key_for_item(item)
            if not key:
                return web.json_response({"error": "Invalid favorite payload"}, status=400)

            if _has_local_favorite(key):
                _remove_local_favorite(key=key)
                return web.json_response({"ok": True, "favorited": False, **list_local_favorites_payload()})

            entry = _upsert_local_favorite(item)
            if not entry:
                return web.json_response({"error": "Invalid favorite payload"}, status=400)
            return web.json_response({"ok": True, "favorited": True, "item": entry, **list_local_favorites_payload()})

        entry = _upsert_local_favorite(item)
        if not entry:
            return web.json_response({"error": "Invalid favorite payload"}, status=400)

        return web.json_response({"ok": True, "item": entry, **list_local_favorites_payload()})
