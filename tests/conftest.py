import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

aiohttp_stub = types.ModuleType("aiohttp")
aiohttp_stub.web = types.SimpleNamespace(json_response=lambda *args, **kwargs: {"args": args, "kwargs": kwargs})
sys.modules.setdefault("aiohttp", aiohttp_stub)
