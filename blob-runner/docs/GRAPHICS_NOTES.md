# Camera and depth — build 9
October 27, 2026

Built on the restored build 7 artwork, rather than the rejected simplified pass.

The camera now translates laterally with the player formation. Steering right
shifts the bridge left while the player's group and number stay centered.
Perspective scales that displacement with distance, so nearby edges move more
than far objects. Forward scrolling, elastic formation following, and independent
bobbing remain intact. World coordinates still determine every mathematical
choice and encounter; projection changes only their screen positions.

Touch steering is relative to the camera position at the start of each drag.
This prevents the moving camera from feeding back into the steering target.
Tapping beside the centered swarm still steers toward that side. Keyboard and
onscreen arrows keep their world-space behavior.

Depth additions retain the textured wooden bridge and rounded glossy blobs:
- raised parapets with lit tops, shaded walls, and seams;
- visible deck thickness and a shaded side/top on the final stone gate;
- faceted rock stacks on either side of the water, placed in world space;
- distant scenery with weaker sideways parallax than the nearby roadway;
- water horizon aligned with the distant bridge plane.

Canvas 2D remains the rendering engine. Sprites, plank grain, posts, scenery,
and crowd mass textures are cached; rock geometry is bounded by draw distance.
There are no external assets, 3D dependencies, or individual collision physics.
