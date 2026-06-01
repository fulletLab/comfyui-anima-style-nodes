# Anima Style Explorer for ComfyUI

![Anima Style Explorer](assets/banner.jpg)

A quality-of-life ComfyUI node for browsing anime artist styles, Animadex style tags, Animadex character tags, local reference previews, and prompt autocomplete directly inside a workflow.

This is an independent community tool. It works offline by default and only uses network features when the user explicitly enables or runs them.

Current version: `1.0.9`

---

## Installation

1. Download or clone this repository.
2. Place the folder inside:

```text
ComfyUI/custom_nodes/
```

3. Restart ComfyUI.

The node appears as:

```text
Anima Style Explorer
```

---

## Basic Workflow

```text
CheckpointLoader
      |
   (clip) ---> Anima Style Explorer ---> (conditioning) ---> KSampler (positive)
                    |
                 prompt
```

The node works like a CLIP Text Encode replacement: write a prompt, choose styles or characters visually, and send the encoded conditioning directly to the sampler.

---

## Features

### Visual Style Browser

Open a large gallery of bundled Anima style references and apply artist tags directly into the prompt.

### Animadex Styles and Characters

The browser includes dedicated tabs for:

- `Animadex Styles`
- `Characters`

Character entries use normal Danbooru-style character tags without `@`. Style entries keep the `@artist` format.

### Trigger and Trigger + Tags

Character cards support two insertion modes:

- `Trigger`: inserts the character trigger only, for example `hatsune miku, vocaloid`
- `Trigger + tags`: inserts the trigger plus useful descriptive tags, for example `hatsune miku, vocaloid, 1girl, aqua eyes, twintails`

### Apply Modal

Clicking `Apply Style` opens a centered modal instead of covering the thumbnail. It lets you:

- add the new style to the prompt
- replace the current style
- replace all current styles
- replace a specific style slot when several artists are active

### Prompt Preview

The browser includes an editable prompt preview synced with the active prompt widget, so changes made by style, character, and Auto Cycle actions are visible immediately.

### Auto Cycle

Auto Cycle can continuously queue prompts while rotating tags. The settings panel supports:

- styles only
- characters only
- styles + characters
- multiple artists per cycle
- multiple character groups per cycle
- `Trigger` or `Trigger + tags` character insertion
- subject tag control such as `1girl`, `1boy`, `2girls`, or keeping the prompt as-is
- repeat count before picking new tags
- uniform random or image-count weighted random
- resume after stop

Auto Cycle keeps style and character replacement separate, so character tags do not overwrite artist tags and artist tags keep their `@`.

### Offline First

The bundled local dataset works without internet. Remote image loading is disabled by default.

Remote preview images for Animadex entries require enabling `Remote Images` from the top bar. When remote images are disabled, tags still work offline.

### Update Styles

Use `Update Styles` from the tools menu to refresh the local style or Animadex indexes when internet access is available.

### Fullet Prompt Publishing

Connect a Fullet Personal API Key to publish recent local generations as normal posts or multi-image style collages.

---

## Internet and Privacy

- Local browsing and autocomplete work offline.
- Remote images are opt-in.
- Updating indexes only happens when the user clicks the update action.
- Fullet publishing only uses the key the user provides.
- API keys are stored locally and are not embedded in workflows.


## Credits

Style explorer and legacy dataset concept by ThetaCursed:

https://thetacursed.github.io/Anima-Style-Explorer

Legacy preview assets:

https://github.com/ThetaCursed/Anima-Assets

Optional Animadex artist and character index:

https://animadex.net

All credit for organization, tagging, and visual references belongs to the original creators.

---

## Compatibility

- ComfyUI latest
- Anima / anime checkpoints

---

## License

Code: MIT License

Dataset references are provided for offline autocomplete and browsing functionality with attribution to the original projects.
