import json
import os
import tempfile

from aiohttp import web

try:
    from . import artist_data
    from .generated_previews import GeneratedPreviewStore
except ImportError:
    import artist_data
    from generated_previews import GeneratedPreviewStore

try:
    import folder_paths
except Exception:
    folder_paths = None


def _env_flag(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def resolve_scan_output_directory(folder_path="", default_output_dir=None, allow_custom_paths=None):
    requested = str(folder_path or "").strip()
    default_dir = str(default_output_dir or "").strip()

    if requested:
        return None, "Custom scan folders are not supported"

    if default_dir:
        output_dir = os.path.abspath(os.path.expanduser(default_dir))
    else:
        return None, "No output directory available"

    if not os.path.isdir(output_dir):
        return None, "Scan folder does not exist"
    return output_dir, None


def register_core_routes(server, require_local_token=None):
    base_dir = os.path.dirname(__file__)
    generated_images_path = os.path.join(base_dir, "data", "generated_gallery_images")
    generated_store = GeneratedPreviewStore(
        os.path.join(base_dir, "data", "generated_previews.json"),
        generated_images_path,
    )

    try:
        img_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "js", "images"))
        os.makedirs(img_path, exist_ok=True)
        server.instance.app.router.add_static("/anima/images/", img_path, show_index=False, follow_symlinks=False)
        print(f" [AnimaStyleExplorer] Static route registered: /anima/images/ -> {img_path}")
    except Exception as e:
        print(f" [AnimaStyleExplorer] Static route error: {e}")

    try:
        os.makedirs(generated_images_path, exist_ok=True)
        server.instance.app.router.add_static(
            "/anima/generated_gallery_images/",
            generated_images_path,
            show_index=False,
            follow_symlinks=False,
        )
    except Exception as e:
        print(f" [AnimaStyleExplorer] Generated gallery image route error: {e}")

    @server.instance.routes.get("/anima/artists")
    async def get_artists(request):
        if str(request.query.get("source", "")).strip().lower() == "animadex":
            source_kind = str(request.query.get("kind", "")).strip().lower()
            return web.json_response(artist_data.load_animadex(source_kind))
        include_animadex = str(request.query.get("animadex", "")).strip().lower() in ("1", "true", "yes", "on")
        return web.json_response(artist_data.load(include_animadex=include_animadex))

    @server.instance.routes.get("/anima/data_stats")
    async def data_stats(request):
        return web.json_response(artist_data.stats())

    @server.instance.routes.get("/anima/random")
    async def get_random(request):
        artist = artist_data.pick_random()
        if not artist:
            return web.json_response({"error": "No artists loaded"}, status=404)
        return web.json_response(artist)

    @server.instance.routes.get("/anima/generated_previews")
    async def get_generated_previews(request):
        output_dir = folder_paths.get_output_directory() if folder_paths is not None else None
        existing_only = str(request.query.get("existing") or "").strip().lower() in ("1", "true", "yes", "on")
        if existing_only:
            return web.json_response(generated_store.load_existing(output_dir=output_dir))
        full = str(request.query.get("full") or "").strip().lower() in ("1", "true", "yes", "on")
        return web.json_response(generated_store.load() if full else generated_store.load_compact())

    @server.instance.routes.post("/anima/generated_previews")
    async def update_generated_previews(request):
        if require_local_token is not None:
            denied = require_local_token(request)
            if denied is not None:
                return denied

        try:
            body = await request.json()
        except Exception:
            body = {}
        if not isinstance(body, dict):
            body = {}
        items = body.get("items")
        if not isinstance(items, list):
            items = []
        return web.json_response(generated_store.upsert_many(items))

    @server.instance.routes.post("/anima/generated_previews/import")
    async def import_generated_previews(request):
        if require_local_token is not None:
            denied = require_local_token(request)
            if denied is not None:
                return denied

        content_type = str(request.headers.get("Content-Type") or "").lower()
        if "multipart/form-data" in content_type:
            reader = await request.multipart()
            field = await reader.next()
            while field is not None and field.name != "file":
                field = await reader.next()
            if field is None:
                return web.json_response({"error": "Missing import file"}, status=400)

            suffix = ".zip" if str(field.filename or "").lower().endswith(".zip") else ".json"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
                temp_path = handle.name
                while True:
                    chunk = await field.read_chunk()
                    if not chunk:
                        break
                    handle.write(chunk)
            try:
                if suffix == ".zip":
                    return web.json_response(generated_store.import_zip(temp_path))
                with open(temp_path, "r", encoding="utf-8") as handle:
                    payload = json.load(handle)
                return web.json_response(generated_store.import_payload(payload))
            finally:
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

        try:
            body = await request.json()
        except Exception:
            body = {}
        return web.json_response(generated_store.import_payload(body if isinstance(body, dict) else {}))

    @server.instance.routes.post("/anima/generated_previews/remove")
    async def remove_generated_previews(request):
        if require_local_token is not None:
            denied = require_local_token(request)
            if denied is not None:
                return denied

        try:
            body = await request.json()
        except Exception:
            body = {}
        if not isinstance(body, dict):
            body = {}

        artists = body.get("artists")
        if not isinstance(artists, list):
            artists = [body.get("artist") or body.get("tag")]
        return web.json_response(generated_store.remove_artists(artists))

    @server.instance.routes.get("/anima/generated_previews/export")
    async def export_generated_previews(request):
        include_images = str(request.query.get("include_images") or "").strip().lower() in ("1", "true", "yes", "on")
        if not include_images:
            return web.json_response(generated_store.export_payload())

        output_dir = folder_paths.get_output_directory() if folder_paths is not None else None
        zip_path = generated_store.export_zip(output_dir=output_dir)
        response = web.FileResponse(path=zip_path)
        response.headers["Content-Disposition"] = f'attachment; filename="{os.path.basename(zip_path)}"'
        return response

    @server.instance.routes.post("/anima/generated_previews/scan_output")
    async def scan_generated_output(request):
        if require_local_token is not None:
            denied = require_local_token(request)
            if denied is not None:
                return denied

        try:
            body = await request.json()
        except Exception:
            body = {}
        if not isinstance(body, dict):
            body = {}

        try:
            max_files = int(body.get("maxFiles") or request.query.get("max_files") or 20000)
        except Exception:
            max_files = 20000
        max_files = max(1, min(max_files, 50000))

        folder_path = str(body.get("folderPath") or request.query.get("folder_path") or "").strip()
        default_output_dir = folder_paths.get_output_directory() if folder_paths is not None else None
        output_dir, path_error = resolve_scan_output_directory(folder_path, default_output_dir=default_output_dir)
        if path_error == "No output directory available":
            return web.json_response({"items": generated_store.load()["items"], "scanned": 0, "matched": 0})
        if path_error:
            return web.json_response({"error": path_error}, status=400)

        view_output_dir = default_output_dir if default_output_dir else output_dir
        return web.json_response(generated_store.scan_output_directory(
            output_dir,
            max_files=max_files,
            view_output_dir=view_output_dir,
        ))

    @server.instance.routes.post("/anima/update")
    async def update_artists(request):
        if require_local_token is not None:
            denied = require_local_token(request)
            if denied is not None:
                return denied

        try:
            body = await request.json()
        except Exception:
            body = {}
        if not isinstance(body, dict):
            body = {}

        include_animadex = str(request.query.get("animadex", "")).strip().lower() in ("1", "true", "yes", "on")
        include_animadex = include_animadex or bool(body.get("animadex"))

        raw_modes = request.query.get("animadex_modes") or body.get("animadexModes") or ""
        animadex_modes = [
            part.strip().lower()
            for part in str(raw_modes).split(",")
            if part.strip()
        ] or None

        try:
            max_pages = int(request.query.get("animadex_max_pages") or body.get("animadexMaxPages") or 0)
        except Exception:
            max_pages = 0
        max_pages = max_pages or None

        success = artist_data.download(
            include_animadex=include_animadex,
            animadex_modes=animadex_modes,
            max_pages=max_pages,
        )
        return web.json_response({
            "success": success,
            "includeAnimadex": include_animadex,
            "stats": artist_data.stats(),
        })

    @server.instance.routes.post("/anima/download_images")
    async def download_images(request):
        if require_local_token is not None:
            denied = require_local_token(request)
            if denied is not None:
                return denied
        success = artist_data.start_image_download()
        return web.json_response({"success": success})

    @server.instance.routes.get("/anima/download_status")
    async def download_status(request):
        return web.json_response(artist_data.get_download_status())

