try:
    from server import PromptServer
    from . import routes
    routes.register(PromptServer)
    print(" [AnimaStyleExplorer] Routes registered successfully.")
except Exception as e:
    print(f" [AnimaStyleExplorer] Error registering routes: {e}")

WEB_DIRECTORY = "./js"
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

try:
    from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
except ImportError as e:
    print(f" [AnimaStyleExplorer] Error loading node mappings: {e}")

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
