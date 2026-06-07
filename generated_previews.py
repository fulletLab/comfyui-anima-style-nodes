import json
import os
import re
import time
import zlib
import shutil
import zipfile
from pathlib import Path
from urllib.parse import urlencode


ARTIST_RE = re.compile(r"[^a-z0-9_()]+")
PROMPT_ARTIST_RE = re.compile(r"@([^,\n]+)")
IMAGE_EXTENSIONS = {".png"}
EXPORT_VERSION = 1


def normalize_artist_tag(value):
    raw = re.sub(r"^@+", "", str(value or "").strip().lower())
    raw = re.sub(r"\\([()])", r"\1", raw)
    raw = raw.replace(" ", "_").replace("-", "_")
    raw = ARTIST_RE.sub("_", raw)
    return re.sub(r"_+", "_", raw).strip("_")


def extract_prompt_artist(value):
    match = PROMPT_ARTIST_RE.search(str(value or ""))
    return match.group(1).strip() if match else ""


def build_view_url(item):
    filename = str(item.get("filename") or "").strip()
    file_type = str(item.get("type") or item.get("fileType") or "output").strip() or "output"
    subfolder = str(item.get("subfolder") or "").strip()
    params = {
        "filename": filename,
        "type": file_type,
    }
    if subfolder:
        params["subfolder"] = subfolder
    return f"/view?{urlencode(params)}"


def _decode_png_text_chunks(path):
    values = {}
    try:
        with Path(path).open("rb") as handle:
            if handle.read(8) != b"\x89PNG\r\n\x1a\n":
                return values
            while True:
                raw_len = handle.read(4)
                if len(raw_len) != 4:
                    break
                length = int.from_bytes(raw_len, "big")
                chunk_type = handle.read(4)
                data = handle.read(length)
                handle.read(4)
                if chunk_type == b"IEND":
                    break
                if chunk_type == b"tEXt":
                    key, _, text = data.partition(b"\x00")
                    if key:
                        values[key.decode("latin-1", "ignore")] = text.decode("utf-8", "ignore")
                elif chunk_type == b"iTXt":
                    parts = data.split(b"\x00", 5)
                    if len(parts) == 6:
                        key, compressed, _method, _lang, _translated, text = parts
                        if compressed == b"\x01":
                            try:
                                text = zlib.decompress(text)
                            except Exception:
                                text = b""
                        if key:
                            values[key.decode("latin-1", "ignore")] = text.decode("utf-8", "ignore")
    except Exception:
        return {}
    return values


def _is_prompt_graph(candidate):
    if not isinstance(candidate, dict):
        return False
    for value in candidate.values():
        if isinstance(value, dict) and ("class_type" in value or isinstance(value.get("inputs"), dict)):
            return True
    return False


def _collect_text_candidates(graph):
    positives = []
    negatives = []
    artist_hints = []
    if not isinstance(graph, dict):
        return positives, negatives, artist_hints

    for node_id, node in graph.items():
        if not isinstance(node, dict):
            continue
        class_type = str(node.get("class_type") or "").lower()
        inputs = node.get("inputs") if isinstance(node.get("inputs"), dict) else {}
        for key, raw_value in inputs.items():
            if not isinstance(raw_value, str):
                continue
            value = raw_value.strip()
            if not value:
                continue
            key_lower = str(key or "").lower()
            score_base = len(value)
            if "@" in value:
                artist_hints.append((value, score_base + (2000 if "tag" in key_lower else 0) + (1500 if "anima" in class_type else 0)))
            if "negative" in key_lower or "neg" in key_lower or "negative" in class_type:
                negatives.append((value, score_base + (500 if "text" in key_lower else 0)))
            elif (
                re.match(r"^(text|prompt|positive|positive_prompt|string|style_prompt)$", key_lower)
                or "cliptextencode" in class_type
                or "anima" in class_type
            ):
                positives.append((
                    value,
                    score_base
                    + (1000 if "@" in value else 0)
                    + (400 if "prompt" in key_lower else 0)
                    + (500 if "cliptextencode" in class_type else 0)
                    + (700 if "anima" in class_type else 0),
                ))

    positives.sort(key=lambda item: item[1], reverse=True)
    negatives.sort(key=lambda item: item[1], reverse=True)
    artist_hints.sort(key=lambda item: item[1], reverse=True)
    return positives, negatives, artist_hints


def _scan_prompt_metadata(text_values):
    for key in ("prompt", "workflow"):
        raw = text_values.get(key)
        if not raw:
            continue
        try:
            parsed = json.loads(raw)
        except Exception:
            continue
        if _is_prompt_graph(parsed):
            return parsed
        if isinstance(parsed, dict):
            for value in parsed.values():
                if _is_prompt_graph(value):
                    return value
    return None


def _item_from_image_file(path, output_dir):
    text_values = _decode_png_text_chunks(path)
    graph = _scan_prompt_metadata(text_values)
    positives, negatives, artist_hints = _collect_text_candidates(graph)
    positive_prompt = positives[0][0] if positives else ""
    negative_prompt = negatives[0][0] if negatives else ""
    artist = extract_prompt_artist(positive_prompt) or extract_prompt_artist(artist_hints[0][0] if artist_hints else "")
    if not artist:
        return None

    path = Path(path)
    output_dir = Path(output_dir)
    try:
        relative = path.relative_to(output_dir)
    except Exception:
        relative = path.name
    if isinstance(relative, Path):
        parts = relative.parts
        filename = parts[-1]
        subfolder = "/".join(parts[:-1])
    else:
        filename = str(relative)
        subfolder = ""

    prompt_preview = re.sub(r"^\s*@[^,\n]+\s*,?\s*", "", positive_prompt).strip()
    return {
        "artist": artist,
        "filename": filename,
        "subfolder": subfolder,
        "type": "output",
        "timestamp": path.stat().st_mtime * 1000,
        "prompt": positive_prompt,
        "promptPreview": prompt_preview,
        "negativePrompt": negative_prompt,
        "metadata": {
            "artist": artist,
            "prompt": positive_prompt,
            "negativePrompt": negative_prompt,
            "filename": filename,
            "subfolder": subfolder,
            "fileType": "output",
        },
    }


class GeneratedPreviewStore:
    def __init__(self, path, image_dir=None):
        self.path = Path(path)
        self.image_dir = Path(image_dir) if image_dir else self.path.parent / "generated_gallery_images"

    def load(self):
        if not self.path.exists():
            return {"items": []}
        try:
            with self.path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
        except Exception:
            return {"items": []}

        raw_items = data.get("items") if isinstance(data, dict) else []
        changed = False
        current = {}
        for raw in raw_items:
            if not isinstance(raw, dict):
                changed = True
                continue
            item = self._normalize_item(raw)
            if not item:
                changed = True
                continue
            if str(raw.get("artist") or "") != item.get("artist"):
                changed = True
            artist = item.get("artist")
            previous = current.get(artist)
            if previous:
                changed = True
            if not previous or (item.get("timestamp") or 0) >= (previous.get("timestamp") or 0):
                current[artist] = item

        items = list(current.values())
        items.sort(key=lambda item: item.get("timestamp") or 0, reverse=True)
        if changed:
            self._save(items)
        return {"items": items}

    def load_existing(self, output_dir=None):
        return self.prune_missing(output_dir=output_dir)

    def prune_missing(self, output_dir=None):
        current = self.load()["items"]
        kept = []
        removed = 0
        for item in current:
            if self._item_image_exists(item, output_dir=output_dir):
                kept.append(item)
            else:
                removed += 1
        if removed:
            self._save(kept)
        return {"items": kept, "removed": removed}

    def upsert_many(self, items):
        current = {
            item["artist"]: item
            for item in self.load()["items"]
            if item.get("artist")
        }

        changed = False
        for raw in items or []:
            if not isinstance(raw, dict):
                continue
            item = self._normalize_item(raw)
            if not item:
                continue
            artist = item["artist"]
            previous = current.get(artist)
            if not previous or (item.get("timestamp") or 0) >= (previous.get("timestamp") or 0):
                current[artist] = item
                changed = True

        result = sorted(current.values(), key=lambda item: item.get("timestamp") or 0, reverse=True)
        if changed:
            self._save(result)
        return {"items": result}

    def import_payload(self, payload):
        raw_items = payload.get("items") if isinstance(payload, dict) else []
        if not isinstance(raw_items, list):
            raw_items = []
        return self.upsert_many(raw_items)

    def remove_artists(self, artists):
        targets = {
            normalize_artist_tag(artist)
            for artist in (artists or [])
            if normalize_artist_tag(artist)
        }
        if not targets:
            return {"items": self.load()["items"], "removed": 0}

        items = self.load()["items"]
        kept = [item for item in items if item.get("artist") not in targets]
        removed = len(items) - len(kept)
        if removed:
            self._save(kept)
        return {"items": kept, "removed": removed}

    def export_payload(self):
        return {
            "animaGeneratedGalleryVersion": EXPORT_VERSION,
            "exportedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "items": self.load()["items"],
        }

    def export_zip(self, output_dir=None):
        self.image_dir.mkdir(parents=True, exist_ok=True)
        timestamp = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
        zip_path = self.image_dir / f"anima-generated-gallery-{timestamp}.zip"
        payload = self.export_payload()
        items = payload.get("items", [])

        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            exported_items = []
            for index, item in enumerate(items):
                item = dict(item)
                source_path = self._source_image_path(item, output_dir=output_dir)
                if source_path and source_path.exists() and source_path.is_file():
                    ext = source_path.suffix.lower() or ".png"
                    filename = f"{index + 1:05d}-{_safe_file_stem(item.get('artist') or 'image')}{ext}"
                    archive.write(source_path, f"images/{filename}")
                    item["exportImage"] = f"images/{filename}"
                exported_items.append(item)
            payload["items"] = exported_items
            archive.writestr("gallery.json", json.dumps(payload, ensure_ascii=False, indent=2))

        return zip_path

    def import_zip(self, zip_path):
        self.image_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path, "r") as archive:
            try:
                payload = json.loads(archive.read("gallery.json").decode("utf-8"))
            except Exception:
                payload = {"items": []}

            items = payload.get("items") if isinstance(payload, dict) else []
            if not isinstance(items, list):
                items = []

            imported = []
            for index, raw in enumerate(items):
                if not isinstance(raw, dict):
                    continue
                item = dict(raw)
                image_name = str(item.get("exportImage") or "").strip()
                if image_name and image_name in archive.namelist():
                    ext = Path(image_name).suffix.lower() or ".png"
                    filename = f"{int(time.time() * 1000)}-{index:05d}-{_safe_file_stem(item.get('artist') or 'image')}{ext}"
                    target = self.image_dir / filename
                    with archive.open(image_name) as source, target.open("wb") as dest:
                        shutil.copyfileobj(source, dest)
                    item["filename"] = filename
                    item["subfolder"] = ""
                    item["type"] = "local"
                    item["viewUrl"] = f"/anima/generated_gallery_images/{filename}"
                imported.append(item)

        return self.upsert_many(imported)

    def scan_output_directory(self, output_dir, max_files=2000, view_output_dir=None):
        scan_root = Path(output_dir)
        view_root = Path(view_output_dir) if view_output_dir else scan_root
        if not scan_root.exists() or not scan_root.is_dir():
            return {"items": self.load()["items"], "scanned": 0, "matched": 0}

        files = []
        for dirpath, _dirnames, filenames in os.walk(scan_root):
            for filename in filenames:
                path = Path(dirpath) / filename
                if path.suffix.lower() in IMAGE_EXTENSIONS:
                    try:
                        files.append((path.stat().st_mtime, path))
                    except Exception:
                        continue

        files.sort(key=lambda item: item[0], reverse=True)
        matched = []
        for _mtime, path in files[:max(1, int(max_files or 2000))]:
            item = _item_from_image_file(path, view_root)
            if item:
                matched.append(item)

        result = self.upsert_many(matched) if matched else self.load()
        result["scanned"] = min(len(files), max(1, int(max_files or 2000)))
        result["matched"] = len(matched)
        return result

    def _normalize_item(self, raw):
        metadata = raw.get("metadata")
        metadata_artist = metadata.get("artist") if isinstance(metadata, dict) else ""
        prompt_artist = extract_prompt_artist(raw.get("prompt"))
        artist = normalize_artist_tag(metadata_artist or prompt_artist or raw.get("artist") or raw.get("tag"))
        filename = str(raw.get("filename") or "").strip()
        view_url = str(raw.get("viewUrl") or raw.get("imageUrl") or "").strip()
        if not artist or (not filename and not view_url):
            return None

        file_type = str(raw.get("type") or raw.get("fileType") or "output").strip() or "output"
        subfolder = str(raw.get("subfolder") or "").strip()
        try:
            timestamp = float(raw.get("timestamp") or 0)
        except Exception:
            timestamp = 0
        if timestamp <= 0:
            timestamp = time.time() * 1000

        item = {
            "artist": artist,
            "filename": filename,
            "subfolder": subfolder,
            "type": file_type,
            "timestamp": timestamp,
            "viewUrl": view_url,
        }
        if not item["viewUrl"]:
            item["viewUrl"] = build_view_url(item)

        for key in ("prompt", "promptPreview", "negativePrompt", "historyId", "exportImage"):
            value = raw.get(key)
            if value is not None:
                item[key] = str(value)

        if isinstance(metadata, dict):
            item["metadata"] = metadata
        return item

    def _save(self, items):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": 1,
            "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "items": items,
        }
        tmp_path = self.path.with_suffix(f"{self.path.suffix}.tmp")
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.path)

    def _source_image_path(self, item, output_dir=None):
        file_type = str(item.get("type") or "output").strip().lower()
        filename = str(item.get("filename") or "").strip()
        if not filename:
            return None
        if file_type == "local":
            candidate = self.image_dir / filename
            return candidate if candidate.exists() else None
        if file_type != "output" or not output_dir:
            return None
        subfolder = str(item.get("subfolder") or "").strip()
        root = Path(output_dir)
        candidate = root / subfolder / filename if subfolder else root / filename
        try:
            candidate.relative_to(root)
        except Exception:
            return None
        return candidate

    def _item_image_exists(self, item, output_dir=None):
        source_path = self._source_image_path(item, output_dir=output_dir)
        if source_path is not None:
            return source_path.exists() and source_path.is_file()
        filename = str(item.get("filename") or "").strip()
        view_url = str(item.get("viewUrl") or "").strip()
        return bool(view_url and not filename)


def _safe_file_stem(value):
    stem = re.sub(r"[^a-zA-Z0-9_.()-]+", "_", str(value or "").strip())
    return stem.strip("._")[:80] or "image"
