# Blob Runner — Integer Run
Build 10 · October 28, 2026

Open **Blob_Runner.html** offline, or use index.html with its adjacent src folder.
The public repository is keeganfinlayson/Integer-Run. Its root index.html is a
copy of the self-contained build for GitHub Pages.

## Student feedback changes
- Default speed 88, up from 52. Relaxed 70 and Fast 108 are available.
- Three longer courses: Riverstone Run (3100), Amber Crossing (3700), and
  Twilight Rush (4300); the previous course length was 1580.
- Multiple solutions: 12, 18, and 18 successful choice sequences, with different
  signed endings. All three courses are available from Levels.
- Operations and the initial pair of armies shuffle left/right on a new run.
  Retry/Restart keeps the layout for strategy practice.
- Full-width stone gates explicitly say POSITIVE + or NEGATIVE −.
- Cached faceted islets, trees, lit stone posts, raised bridge edges, textured
  planks, and three environment palettes add depth. The centered tracking camera
  and simple nonhuman blob sprites are retained.

Arrow keys, A/D, dragging, or the bottom arrows steer. Space pauses; R restarts.
Help and fullscreen are available. Zero always loses. The final gate admits the
whole swarm only when 0 < |value| < 5. No rewind, accounts, trackers, or network
assets. The playfield stays 9:16 on desktop and mobile.

## Source and validation
- src/model.js: exact arithmetic, seeded layouts, course specifications, solver.
- src/game.js: fixed-step gameplay, event sequence, controls, camera, rendering.
- src/art.js: original cached Canvas artwork and environment themes.
- src/shell.html and styles.css: UI, setup, Help, and responsive layout.
- build.py: generates both entry points with Python 3.
- docs/LEVEL_SOLUTION.md: intended routes, alternatives, and failures.
- docs/VERIFICATION.md: checks, performance, and device limits.

Run `python3 blob-runner/build.py` from the repository root. Copy
blob-runner/Blob_Runner.html to the root index.html before deploying.
Run `node blob-runner/tests/model.test.cjs`; browser.cjs, layout.cjs, and
performance.cjs in the same directory require Playwright and Chromium.
Runtime dependencies: none. Fullscreen may be restricted by an embedding host.
