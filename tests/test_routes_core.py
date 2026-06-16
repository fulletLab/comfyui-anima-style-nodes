import tempfile
import unittest
from pathlib import Path

import routes_core
from generated_previews import GeneratedPreviewStore


class _RouteCollector:
    def __init__(self):
        self.paths = []
        self.handlers = {}

    def get(self, path):
        self.paths.append(("GET", path))
        def decorator(handler):
            self.handlers[("GET", path)] = handler
            return handler
        return decorator

    def post(self, path):
        self.paths.append(("POST", path))
        def decorator(handler):
            self.handlers[("POST", path)] = handler
            return handler
        return decorator


class _RouterCollector:
    def add_static(self, *args, **kwargs):
        return None


class _ServerStub:
    def __init__(self):
        self.routes = _RouteCollector()
        self.instance = self
        self.app = type("App", (), {"router": _RouterCollector()})()


class ScanOutputPathTests(unittest.TestCase):
    def test_custom_scan_path_is_rejected_by_default(self):
        with tempfile.TemporaryDirectory() as output_dir, tempfile.TemporaryDirectory() as other_dir:
            resolved, error = routes_core.resolve_scan_output_directory(
                folder_path=other_dir,
                default_output_dir=output_dir,
                allow_custom_paths=False,
            )

        self.assertIsNone(resolved)
        self.assertEqual(error, "Custom scan folders are not supported")


class CoreRouteCleanupTests(unittest.TestCase):
    def test_debug_test_route_is_not_registered(self):
        server = _ServerStub()
        routes_core.register_core_routes(server)

        self.assertNotIn(("GET", "/anima/test"), server.routes.paths)

    def test_default_output_directory_is_allowed(self):
        with tempfile.TemporaryDirectory() as output_dir:
            resolved, error = routes_core.resolve_scan_output_directory(
                folder_path="",
                default_output_dir=output_dir,
                allow_custom_paths=False,
            )

            self.assertIsNone(error)
            self.assertEqual(Path(resolved), Path(output_dir).resolve())

    def test_custom_scan_path_is_not_available_even_when_env_enabled(self):
        with tempfile.TemporaryDirectory() as output_dir, tempfile.TemporaryDirectory() as other_dir:
            resolved, error = routes_core.resolve_scan_output_directory(
                folder_path=other_dir,
                default_output_dir=output_dir,
                allow_custom_paths=True,
            )

        self.assertIsNone(resolved)
        self.assertEqual(error, "Custom scan folders are not supported")


class ArtistsRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_default_artists_route_excludes_animadex_payload(self):
        server = _ServerStub()
        routes_core.register_core_routes(server)
        handler = server.routes.handlers[("GET", "/anima/artists")]
        calls = []

        original_load = routes_core.artist_data.load
        try:
            routes_core.artist_data.load = lambda include_animadex=True: calls.append(include_animadex) or []
            request = type("Request", (), {"query": {}})()

            await handler(request)
        finally:
            routes_core.artist_data.load = original_load

        self.assertEqual(calls, [False])


class GeneratedPreviewsRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_default_generated_previews_route_uses_compact_load_and_does_not_prune(self):
        server = _ServerStub()
        routes_core.register_core_routes(server)
        handler = server.routes.handlers[("GET", "/anima/generated_previews")]
        calls = []

        original_load = routes_core.GeneratedPreviewStore.load
        original_load_compact = routes_core.GeneratedPreviewStore.load_compact
        original_prune = routes_core.GeneratedPreviewStore.prune_missing
        try:
            routes_core.GeneratedPreviewStore.load = lambda self: calls.append("load") or {"items": []}
            routes_core.GeneratedPreviewStore.load_compact = lambda self: calls.append("compact") or {"items": []}
            routes_core.GeneratedPreviewStore.prune_missing = (
                lambda self, output_dir=None: calls.append("prune") or {"items": []}
            )
            request = type("Request", (), {"query": {}})()

            await handler(request)
        finally:
            routes_core.GeneratedPreviewStore.load = original_load
            routes_core.GeneratedPreviewStore.load_compact = original_load_compact
            routes_core.GeneratedPreviewStore.prune_missing = original_prune

        self.assertEqual(calls, ["compact"])

    async def test_scan_output_uses_large_default_file_limit(self):
        server = _ServerStub()
        routes_core.register_core_routes(server)
        handler = server.routes.handlers[("POST", "/anima/generated_previews/scan_output")]
        calls = []

        original_folder_paths = routes_core.folder_paths
        original_scan = routes_core.GeneratedPreviewStore.scan_output_directory
        try:
            routes_core.folder_paths = type(
                "FolderPaths",
                (),
                {"get_output_directory": staticmethod(lambda: str(Path.cwd()))},
            )()
            routes_core.GeneratedPreviewStore.scan_output_directory = (
                lambda self, output_dir, max_files=2000, view_output_dir=None:
                calls.append(max_files) or {"items": [], "scanned": 0, "matched": 0}
            )
            request = type(
                "Request",
                (),
                {"query": {}, "json": lambda self: {}},
            )()

            await handler(request)
        finally:
            routes_core.folder_paths = original_folder_paths
            routes_core.GeneratedPreviewStore.scan_output_directory = original_scan

        self.assertEqual(calls, [20000])


class GeneratedPreviewPathTests(unittest.TestCase):
    def test_compact_load_keeps_only_gallery_card_fields(self):
        with tempfile.TemporaryDirectory() as store_dir:
            store = GeneratedPreviewStore(Path(store_dir) / "generated_previews.json")
            store.upsert_many([{
                "artist": "alpha_style",
                "filename": "alpha.png",
                "type": "output",
                "timestamp": 100,
                "prompt": "large prompt",
                "metadata": {"artist": "alpha_style", "workflow": "large metadata"},
            }])

            items = store.load_compact()["items"]

        self.assertEqual(items, [{
            "artist": "alpha_style",
            "filename": "alpha.png",
            "subfolder": "",
            "type": "output",
            "timestamp": 100.0,
            "viewUrl": "/view?filename=alpha.png&type=output",
        }])

    def test_output_source_path_rejects_parent_directory_escape(self):
        with tempfile.TemporaryDirectory() as output_dir, tempfile.TemporaryDirectory() as store_dir:
            output_path = Path(output_dir)
            store = GeneratedPreviewStore(Path(store_dir) / "generated_previews.json")

            source = store._source_image_path({
                "type": "output",
                "filename": "secret.png",
                "subfolder": "..",
            }, output_dir=output_path)

        self.assertIsNone(source)

    def test_local_source_path_rejects_parent_directory_escape(self):
        with tempfile.TemporaryDirectory() as store_dir:
            secret = Path(store_dir) / "secret.png"
            secret.write_bytes(b"secret")
            image_dir = Path(store_dir) / "images"
            store = GeneratedPreviewStore(Path(store_dir) / "generated_previews.json", image_dir=image_dir)

            source = store._source_image_path({
                "type": "local",
                "filename": "../secret.png",
            })

        self.assertIsNone(source)


if __name__ == "__main__":
    unittest.main()
