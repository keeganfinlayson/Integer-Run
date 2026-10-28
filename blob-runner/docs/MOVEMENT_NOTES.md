# Visual and movement revision — build 6

The four supplied commercial screenshots guide camera framing, road spacing,
relative crowd size, and continuous movement. The supplied storyboard guides
mathematical interactions only; its detailed characters and illustrated
arithmetic were not copied into the build.

## Implemented
- Broader elevated perspective: far-to-near road width ratio increased from
  approximately 0.22 to 0.38 at the current view distance.
- Road continues under the player through the bottom of the viewport.
- Player remains at a consistent screen depth while road boards and encounters
  approach in perspective. Planning distance and level timing stay unchanged.
- Stable particle identities within a loose packed disk. Each member has a
  different follow response, producing a delayed tail during lateral steering.
- Small independent bob and sideways sway with staggered deterministic phases.
- Footprint magnitude eases toward the exact integer magnitude; newly visible
  members fade into the formation. The mathematical value changes immediately.
- Two cached dense mass textures supply large-crowd continuity; foreground
  sprites remain capped. No pairwise collision or separation solver is used.
- The crowd footprint remains inside the roadway during steering.
- Both incoming swarms move simultaneously at 22 world units/second, taking a direct diagonal route
  from their own positions to the nearest part of the player's front. Contact determines arrival order.
- Same signs merge immediately. Opposite signs cancel at the actual impact
  point over 0.7 seconds. The other swarm keeps approaching during cancellation.
  No separate battle layout, fixed army selector, or repositioned second army.
- Player forward speed increased from 42 to 52 world units/second.
- A centered 9:16 portrait frame is maintained on desktop, mobile, and fullscreen.
- Exact equal decrements, signed survivors, zero failure, and the first level's
  intended arithmetic path are preserved.

## Online references checked
- Developer listing: https://play.google.com/store/apps/details?id=freeplay.crowdrun.com
- Developer game page: https://freeplay.io/games/count-masters/
- User-supplied showcase: https://mwm.ai/apps/count-masters-crowd-runner-3d/1568245971
- User-supplied gameplay page: https://www.dailymotion.com/video/x9z1q66

The developer listing confirms the crowd-running, growth, and encounter game
framing. The showcase and gameplay pages expose trailer/footage references,
but playable video frames were unavailable in the retrieval environment.
No claim is made to have watched or measured their animation. Differential
follow, footprint easing, and bob parameters are this build's lightweight
implementation of the user's supplied movement description.

Reference attachment filenames: image(20261023-135622).png,
image(20261023-135633).png, image(20261023-135642).png,
image(20261023-135654).png, image(20261023-135703).png.

Build 4 removes the delayed lateral homing phase and uses a normalized direct approach vector. There is no center waypoint. The player label is below/behind the group; incoming labels stay above their groups.

Build 5 replaces the blocked operation circle with a full-width positive-only forcefield. The two preceding circles flip or preserve sign. Passing the field never changes quantity.

Build 6: larger formations and members; all army labels are placed after rendering and avoid every army’s bounding rectangle. The player number stays below. The top count panel is removed. The sign field is now a colored stone gateway with no floating rule text. Reaching zero immediately ends the run; no enemy survivors transfer to the player.

## Build 9 lateral tracking
The elevated viewing angle remains fixed, but the camera translates sideways
with the player's visual formation. The player and its number stay centered;
road edges, operations, and incoming armies project relative to the camera.
Nearby objects shift farther than distant objects. Input, steering lanes, and
encounters remain in world space. Each touch drag uses its initial camera
position as a stable reference, preventing steering feedback.
