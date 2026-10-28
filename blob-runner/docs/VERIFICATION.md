# Verification — build 9
October 27, 2026

## Gameplay and zero rule
The winning browser playthrough ends at +2 and passes the blue sign gate at
+20. The revised path is:
`+24 → −48 → −68 → −20 → +20 → +8 → +4 → +2`.
The final incoming group changed from −16 to −4 so the player is never exhausted.
The wrong final operation leaves the whole −8 blocked by the strict size gate.

Two browser zero tests passed: an equal −48/+48 encounter ends at zero; an
outnumbered −48/+60 encounter stops at player zero with +12 enemy survivors.
The run ends immediately and never continues as +12. Operations that produce
zero also fail. Opposing armies reaching zero are allowed; the loss rule applies
to the player's army.

139983 arithmetic equality checks passed. All 32 choice combinations
were enumerated: one win, eight zero losses, twelve wrong-sign failures, and
eleven final-size failures. Safe integer, division, cancellation invariants, and
strict gate comparisons remain tested.

## Labels, rendering, and controls
The top “Your swarm” count panel was removed from the document. Army sprites
and footprints are about 50% larger. The sign gate is built from colored stone
pillars and lintel; its floating “positive only” label and energy curtain are gone.
Blue still admits positive values; all lanes share the same sign check.

Number boxes are placed after army rendering using actual sprite/mass bounds.
Each candidate must clear every army and each already-placed number box.
Player labels prefer the space below the formation; incoming labels prefer above.
The browser harness repeatedly asserts that every visible army has a number
and that no number rectangle intersects any army rectangle. Visual review
covered the larger crowds, player label, stone gate, and local impacts.

The winning path, zero cases, full-width sign failure, entire-army size failure,
direct incoming routes, other-army motion during impacts, footprint easing,
individual follow lag, keyboard/touch/held buttons, pause, Help restoration,
restart, and fullscreen entry/exit passed. No page errors occurred. Portrait
layout/iframe tests passed at 844×390, 390×844, 1024×768, and 320×568 viewports.
The game loads in a script-only sandbox iframe without external dependencies.

## Performance
Headless Chromium 153.0.8010.0 with software rendering. Four-second
real-animation draw-loop samples use a paused world for a stable scene. CPU
throttling is a proxy, not actual Chromebook hardware.

| Scene | Approx. FPS | Mean Canvas draw | Draw calls |
|---|---:|---:|---:|
| 24 blobs, desktop, normal CPU | 60.0 | 0.53 ms | 92 |
| 10000 quantity, desktop, 4x CPU throttle | 42.9 | 2.95 ms | 249 |
| 10000 quantity, phone viewport, 4x CPU throttle | 48.0 | 3.26 ms | 249 |

The stress quantity remains exactly 10,000. Its sprite sample and one cached
mass texture are capped independently of that quantity. Physical Chromebooks,
Safari/iPad, Android, and school filtering remain untested. Fullscreen can be
restricted by an embedding host. Raw results and reproducible tests are included.

## Build 9 camera and depth verification
The browser harness now verifies camera tracking in both lateral directions,
player number centering, stronger near-road displacement than far-road
displacement, and a stationary camera while paused. Screenshots were reviewed
internally at both steering extremes and on a phone viewport. The camera is
render-only: world coordinates, arithmetic, level values, contact checks, and
zero-loss rules are unchanged. The full winning +2 playthrough, failure branches,
label separation, controls, fullscreen, and portrait/iframe checks passed.
Touch taps and held onscreen arrows were retested with the new camera mapping.
The performance table above was regenerated with the new geometry and camera.
See GRAPHICS_NOTES.md for implementation and visual changes.
