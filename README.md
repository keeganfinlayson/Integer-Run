# Blob Runner — Integer Run

[Play Blob Runner](https://keeganfinlayson.github.io/Integer-Run/)

A portrait signed-integer crowd runner with exact arithmetic and a sideways tracking camera.

Build 10 adds three longer courses, multiple successful strategies, shuffled left/right choices, labeled positive/negative stone gates, three pace settings, and themed 3D-style scenery.

The root `index.html` is the complete self-contained game, with no external dependencies. Download it for offline use or embedding.

Editable source, build script, course solutions, verification report, and tests are in [`blob-runner/`](blob-runner/). Rebuild with `python3 blob-runner/build.py`, then copy `blob-runner/Blob_Runner.html` to `index.html` before publishing.

Arrow keys, A/D, dragging, or onscreen arrows steer. Space pauses; R restarts. **Levels** chooses course and pace. Restart repeats the current layout; a new run reshuffles.
