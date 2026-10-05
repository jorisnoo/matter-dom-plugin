# Changelog

## [Unreleased]

## [2.0.1] - 2026-10-05

### Fixed

- Anchor DOM bodies to their containing block's origin so normal HTML flow does not offset rendering or drag selection. Measure block colliders after applying absolute positioning so auto-sized elements match their physics geometry.
- Respect mouse collision filters and actual body shapes when selecting a body, and allow dragging compound bodies through their DOM parts.
- Render compound parts with their individual rotations.
- Preserve DOM rendering and coordinate conversion when polygons with fewer than three sides fall back to circles.
- Prevent repeated renderer starts from creating extra animation loops that cannot be stopped.
- Make mouse constraint types compatible with Matter.js world insertion and drag events, including compound parents.
- Include the required Matter.js fork in the installation instructions and document scene positioning and sizing.
