# Verification — build 10
October 28, 2026

## Mathematics and solvability
148326 arithmetic/course equality checks passed. Exact addition, subtraction,
multiplication, integral division, safe integer checks, cancellation invariants,
strict capacity comparisons, and sign constraints remain covered.

The full route solver enumerates every operation choice and both initial
encounter orders. It finds 12, 18, and 18 successful choice sequences for the
three courses, with multiple signed endings. Across 100 seeds per course,
all operations and initial armies appear on both sides; solution counts and
ending sets stay unchanged. The same seed reconstructs the same course. All
three difficulty paces preserve the mathematical routes. Every final division
is integral; the other final operation cannot pass. Zero always loses.

Failure counts in arithmetic-results.json count pruned branches, not a flat
number of full paths: once a branch fails, later choices are not enumerated.

## Actual-browser playthroughs and controls
Headless Chromium completed eight winning playthroughs: two routes per course
at Standard, plus Relaxed and Fast on course 1. All passed both sign gates and
finished with the solver's exact value. Deliberate zero, wrong-sign, and final
size failures also passed. The complete army stops at a failed gate; enemy
survivors do not transfer to an exhausted player.

Next-course progression, course selection, pace selection, stable-layout retry,
keyboard, touch tap, dragging without camera feedback, pause, Help restoration,
restart, and fullscreen were checked. The camera follows the swarm laterally
and keeps its number centered. Every sampled army number clears every army.
Both POSITIVE + and NEGATIVE − were observed in Canvas draw output. No page
errors occurred. Internal screenshots covered all themes, both gate types,
course results, and lateral camera movement.

Portrait layout and script-only iframe tests passed at 844×390, 390×844,
1024×768, and 320×568. No page overflow or clipped toolbar rectangles.
The standalone build requires no external assets or network connections.

## Course length and pace
Course lengths are 3100, 3700, and 4300, versus the old 1580. At default speed
88 (old 52), nominal forward-travel times are 35, 42, and 49 seconds, plus
cancellation/encounter time. Relaxed uses 70; Fast uses 108. Difficulty changes
pace and cancellation duration, not arithmetic or the set of possible routes.

## Performance
Four-second real animation-loop samples with a paused world, headless Chromium
153, Linux software rendering. 4× CPU throttling is a proxy, not physical
Chromebook hardware. The 10000-quantity scene loads in a fresh page to prevent
duplicate animation loops from contaminating measurements.

| Scene | Approx. FPS | Mean draw | Visible sprite budget |
|---|---:|---:|---:|
| 24 blobs, desktop, normal CPU | 60.0 | 0.63 ms | 180 |
| 10000 quantity, desktop, 4x CPU throttle | 40.9 | 3.77 ms | 90 |
| 10000 quantity, phone viewport, 4x CPU throttle | 55.0 | 3.61 ms | 90 |

Adaptive detail reduced the stress scene to 90 player sprites and 0.75 canvas
resolution; exact quantity stayed 10000.

The exact stress quantity remains 10000. Visible sprite budget and cached mass
texture stay independent of quantity. Raw results and reproducible tests are
included. Physical Chromebooks, Safari/iPad, Android, and school filtering are
untested. Embedding hosts can restrict fullscreen.
