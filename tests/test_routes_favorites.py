import json
import sys
import tempfile
import types
import unittest
from pathlib import Path

aiohttp_stub = types.ModuleType("aiohttp")
aiohttp_stub.web = types.SimpleNamespace(json_response=lambda *args, **kwargs: {"args": args, "kwargs": kwargs})
sys.modules.setdefault("aiohttp", aiohttp_stub)

import routes_favorites


class _RouteCollector:
    def __init__(self):
        self.paths = []

    def get(self, path):
        self.paths.append(("GET", path))
        return lambda handler: handler

    def post(self, path):
        self.paths.append(("POST", path))
        return lambda handler: handler


class _ServerStub:
    def __init__(self):
        self.routes = _RouteCollector()
        self.instance = self


class FavoriteCategoryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.favorites_path = Path(self.tmp.name) / "favorites.json"
        self.old_path = routes_favorites.LOCAL_FAVORITES_FILE
        routes_favorites.LOCAL_FAVORITES_FILE = str(self.favorites_path)

    def tearDown(self):
        routes_favorites.LOCAL_FAVORITES_FILE = self.old_path
        self.tmp.cleanup()

    def write_payload(self, payload):
        self.favorites_path.write_text(json.dumps(payload), encoding="utf-8")

    def read_payload(self):
        return json.loads(self.favorites_path.read_text(encoding="utf-8"))

    def test_legacy_favorites_load_without_category_loss(self):
        self.write_payload({
            "items": [
                {"kind": "style", "tag": "old_style", "works": 12, "addedAt": "2026-01-01T00:00:00+00:00"}
            ]
        })

        items = routes_favorites.list_local_favorites()
        categories = routes_favorites.list_favorite_categories()

        self.assertEqual([item["key"] for item in items], ["style:old_style"])
        self.assertEqual(items[0].get("category", ""), "")
        self.assertEqual(categories, [])

    def test_upsert_preserves_custom_category_metadata(self):
        routes_favorites.upsert_favorite_category("list1")

        item = routes_favorites._upsert_local_favorite({
            "kind": "style",
            "tag": "new_style",
            "category": "list1",
        })

        self.assertEqual(item["category"], "list1")
        payload = self.read_payload()
        self.assertEqual(payload["categories"][0]["name"], "list1")
        self.assertEqual(payload["items"][0]["category"], "list1")

    def test_batch_assign_adds_selected_items_and_keeps_existing_items(self):
        self.write_payload({
            "items": [
                {"kind": "style", "tag": "keep_me", "category": "list1", "addedAt": "2026-01-01T00:00:00+00:00"}
            ],
            "categories": [{"name": "list1", "createdAt": "2026-01-01T00:00:00+00:00"}],
        })

        result = routes_favorites.batch_assign_favorite_category([
            {"kind": "style", "tag": "batch_a"},
            {"kind": "style", "tag": "batch_b"},
        ], "list2")

        keys = {item["key"]: item for item in result["items"]}
        self.assertEqual(keys["style:keep_me"]["category"], "list1")
        self.assertEqual(keys["style:batch_a"]["category"], "list2")
        self.assertEqual(keys["style:batch_b"]["category"], "list2")
        self.assertIn("list2", [category["name"] for category in result["categories"]])

    def test_batch_assign_can_move_items_to_uncategorized(self):
        self.write_payload({
            "items": [
                {"kind": "style", "tag": "move_me", "category": "list1", "addedAt": "2026-01-01T00:00:00+00:00"}
            ],
            "categories": [{"name": "list1", "createdAt": "2026-01-01T00:00:00+00:00"}],
        })

        result = routes_favorites.batch_assign_favorite_category([
            {"kind": "style", "tag": "move_me"},
        ], "")

        keys = {item["key"]: item for item in result["items"]}
        self.assertEqual(keys["style:move_me"].get("category", ""), "")
        self.assertIn("list1", [category["name"] for category in result["categories"]])

    def test_legacy_custom_styles_file_is_not_exposed_as_favorites(self):
        custom_path = Path(self.tmp.name) / "custom_styles.json"
        old_base_dir = routes_favorites.BASE_DIR
        routes_favorites.BASE_DIR = self.tmp.name
        try:
            custom_path.write_text(json.dumps(["legacy style"]), encoding="utf-8")

            self.assertEqual(routes_favorites.list_style_favorites(), [])
        finally:
            routes_favorites.BASE_DIR = old_base_dir

    def test_legacy_custom_styles_route_is_not_registered(self):
        server = _ServerStub()
        routes_favorites.register_favorite_routes(server, require_local_token=lambda request: None)

        self.assertNotIn(("GET", "/anima/custom_styles"), server.routes.paths)


if __name__ == "__main__":
    unittest.main()
