# Changelog

## [Unreleased]

## [2.0.3] - 2026-11-19

### Fixed

- Align DOM transforms and rotation pivots with asymmetric rounded colliders, clamp polygon chamfers and choose circle detail from the displayed radius.
- Reject incomplete DOM options and elements with no measurable area before creating invalid physics bodies.
- Release a held body and clean up owned mouse listeners when destroying a drag constraint.
- Document exact GitHub installation tags, radius units and how to keep drag interactions scoped to the scene.

## [2.0.2] - 2026-10-05

### Fixed

- Keep rounded DOM blocks draggable when their requested corner radius is larger than the block allows. Clamp scalar and per-corner radii to half the shorter side so small pill-shaped blocks retain valid convex colliders and pass mouse hit tests.

## [2.0.1] - 2026-10-05

### Fixed

- Anchor DOM bodies to their containing block's origin so normal HTML flow does not offset rendering or drag selection. Measure block colliders after applying absolute positioning so auto-sized elements match their physics geometry.
- Respect mouse collision filters and actual body shapes when selecting a body, and allow dragging compound bodies through their DOM parts.
- Render compound parts with their individual rotations.
- Preserve DOM rendering and coordinate conversion when polygons with fewer than three sides fall back to circles.
- Prevent repeated renderer starts from creating extra animation loops that cannot be stopped.
- Make mouse constraint types compatible with Matter.js world insertion and drag events, including compound parents.
- Include the required Matter.js fork in the installation instructions and document scene positioning and sizing.
