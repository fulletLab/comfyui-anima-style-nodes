import nodes

class AnimaStyleExplorer(nodes.CLIPTextEncode):

    CATEGORY = "Anima"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "clip": ("CLIP",),
                "text": ("STRING", {
                    "multiline": True,
                    "default": "1girl, masterpiece, best quality",
                }),
            },
        }
    
NODE_CLASS_MAPPINGS = {
    "AnimaStyleExplorer": AnimaStyleExplorer,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AnimaStyleExplorer": "Anima Style Explorer",
}
