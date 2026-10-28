# Blob Runner

A portrait signed-integer crowd runner with automatic forward movement, lateral camera tracking, and exact arithmetic.

Play through GitHub Pages after enabling **Settings → Pages → Deploy from a branch → main → / (root)**.

The root `index.html` is the complete self-contained game, with no external dependencies. Download it for offline use or embedding.

Editable source, build script, level solution, verification report, and tests are in [`blob-runner/`](blob-runner/). Rebuild with `python3 blob-runner/build.py`, then copy `blob-runner/Blob_Runner.html` to `index.html` before publishing an update.

Controls: arrow keys, A/D, touch/mouse dragging, or the onscreen arrows. Space pauses; R restarts. Help and fullscreen are available.
