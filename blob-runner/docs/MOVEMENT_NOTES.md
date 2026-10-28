# Movement — build 10

The commercial crowd-runner references guide the fixed elevated viewing angle,
continuous roadway, loose crowd formation, and scale. The camera translates
laterally with the player's visual formation, keeping the player and its number
centered while nearby edges shift more than distant objects.

The swarm moves forward automatically and steers continuously with arrows,
A/D, dragging, or held onscreen arrows. Per-member follow lag and independent
bobbing avoid a rigid grid. Visual footprint changes are eased. Exact quantity
is separate from the capped visible sample and cached dense-mass texture.

Incoming swarms use direct shortest routes toward the nearest part of the
player's front. They do not move to a center waypoint. Contact order controls
interaction order. Same signs merge; opposite signs count down at a stationary
impact seam. Other armies keep approaching during cancellation. A player at
zero loses immediately, even when enemy survivors remain.

The three pace options use forward speeds 70, 88, and 108 (previous build: 52).
Incoming movement scales with pace, keeping the same order-based strategies
viable. Cancellation lasts 0.55 seconds, or 0.42 at Fast. Enemies can hold the
next operation ahead until local encounters complete; there is no separate
battle arena or discrete puzzle screen.

Each drag uses its starting camera position as a stable reference. This avoids
steering feedback from the camera following the swarm. Pause freezes progress;
Help restores the prior pause state. Restart preserves the current shuffled
layout. Levels opens the course/pace chooser; Start new run reshuffles.
