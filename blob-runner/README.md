# Blob Runner — The Narrow Escape
Review build 9 · October 27, 2026

Open **Blob_Runner.html** in a browser. It is self-contained and works offline.
`index.html` is the equivalent entry point using the adjacent `src/` directory.
No public GitHub deployment has been created or replaced.

The game stays in a centered 9:16 portrait frame on desktop, phones, and
fullscreen. Steer with arrows, A/D, dragging, or the onscreen arrows. Space
pauses, R restarts, and Help preserves the previous pause state. Fullscreen and
script execution can be restricted by an embedding host.

Blue is positive; red is negative. Same signs merge and opposite signs cancel
at their actual front contact. **If the player's army reaches zero at any point,
the run ends immediately, even if the enemy has survivors.** Blue stone gates
admit positive values; red stone gates admit negative values. Gate color carries
the rule without a floating sign label. Passing a sign gate does not change value.
The final gate tests magnitude and never removes overflow.

Build 6 enlarges members and formations by about 50%, removes the top count
box, and places army labels outside every army's drawn bounds. The player's
number sits below its formation. The final incoming army is now −4 so the new
zero-loss rule has a valid solution ending at +2.

See `docs/LEVEL_SOLUTION.md`, `docs/VERIFICATION.md`, and `docs/MOVEMENT_NOTES.md`.

Source:
- `src/model.js`: exact arithmetic and deterministic level definition.
- `src/art.js`: original cached sprites, wood, stone, shoreline, and water artwork.
- `src/game.js`: cached Canvas sprites, crowd textures, steering, contact checks,
  zero-loss handling, stone gates, and label placement.
- `src/styles.css` and `src/shell.html`: responsive UI and HTML shell.
- `build.py`: rebuilds both entry points with Python 3.
- `tests/`: arithmetic, actual-browser interaction, layout/iframe, performance.

Runtime dependencies: none. Developer browser tests require Playwright and
Chromium. From the package's parent folder, run
`node blob-runner/tests/browser.cjs`, `layout.cjs`, or `performance.cjs` using the
same tests directory. From the package folder run `python3 build.py` and
`node tests/model.test.cjs`.

Graphics are original cached Canvas art: eight 64×64 creature sprites (four variants per color) and two
320×190 crowd textures. Mathematical quantities are independent of the capped
visible detail. No commercial assets, trackers, fonts, or network calls are used.

Build 9 adds lateral camera tracking: the player remains centered as the bridge
moves sideways. Raised stone edges, bridge thickness, shaded gate faces, and
scenery parallax add depth while retaining the build 7 artwork. See
`docs/GRAPHICS_NOTES.md`. The mathematical level and winning +2 route are unchanged.
