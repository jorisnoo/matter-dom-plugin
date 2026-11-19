# matter-dom-plugin

> DOM rendering for [matter.js](https://github.com/liabru/matter-js/)

The matter-dom-plugin brings DOM rendering to the Matter.js physics engine. Objects are created in an HTML-first declarative way so that application logic and view are separate.

This is a fork of [elopezga/matter-dom-plugin](https://github.com/elopezga/matter-dom-plugin), modernized with ES module exports, simplified internals, and additional fixes.

Since v2 the modules are plain ES module exports instead of a `Matter.use()` plugin, so bundlers can tree-shake the unused parts of matter-js (notably its canvas renderer). The render loop also skips DOM writes for bodies that haven't moved, so a settled or sleeping world costs no style recalculation.

## Features

- DOM renderer with view-to-world coordinate mapping
- DOM bodies (`block`, `circle`, `polygon`) from declarative HTML
- Mouse constraint for DOM elements with drag support
- Compound body rendering
- TypeScript definitions
- Requires the [jorisnoo/matter-js](https://github.com/jorisnoo/matter-js) fork (>= 1.0.0) as a peer dependency

## Install

```
npm install github:jorisnoo/matter-dom-plugin#2.0.3 github:jorisnoo/matter-js#1.0.2
```

Both packages come from tagged GitHub forks. The registry's `matter-dom-plugin` package uses the older v1 API.

## Usage

1. Declare physics bodies in your scene

```html
<head>
  <style>
    #scene {
      position: relative;
      height: 320px;
      overflow: hidden;
    }
    #block {
      width: 100px;
      height: 100px;
      background-color: red;
    }
    body {
      margin: 0;
    }
  </style>
</head>
<body>
  <div id="scene"><div id="block"></div></div>
</body>
```

2. Initialize the Matter.js world

```javascript
import { Engine, Runner, Composite } from 'matter-js';
import { RenderDom, DomBodies, DomMouseConstraint } from 'matter-dom-plugin';

// Engine and renderer
const engine = Engine.create();
engine.gravity.y = 0; // Keep the block in the scene until it is dragged.
const render = RenderDom.create({ engine });
RenderDom.run(render);

const runner = Runner.create();
Runner.run(runner, engine);

// Physics body from a DOM element
const block = DomBodies.block(100, 100, {
  Dom: {
    render: render,
    element: document.querySelector('#block'),
  },
});
Composite.add(engine.world, block);

// Listen on the scene, not document.body.
const mouseConstraint = DomMouseConstraint.create(engine, {
  element: document.querySelector('#scene'),
  constraint: { stiffness: 0.1 },
});
Composite.add(engine.world, mouseConstraint);
```

To keep native wheel/trackpad scrolling inside the scene, detach Matter's wheel listener after creating the constraint. To keep native touch scrolling and taps on controls, also detach its three touch listeners; this disables touch dragging, but mouse dragging still works. Input outside the scene is unaffected.

```javascript
const { mouse } = mouseConstraint;
mouse.element.removeEventListener('wheel', mouse.mousewheel);
mouse.element.removeEventListener('touchstart', mouse.mousedown);
mouse.element.removeEventListener('touchmove', mouse.mousemove);
mouse.element.removeEventListener('touchend', mouse.mouseup);
```

When unmounting the scene, call `DomMouseConstraint.destroy(mouseConstraint)`, `RenderDom.stop(render)` and `Runner.stop(runner)`.

## API

### RenderDom

| Method | Description |
|---|---|
| `RenderDom.create(options)` | Create a DOM renderer. Accepts `{ engine }`. Sets up view/world coordinate mapping. |
| `RenderDom.run(render)` | Start the render loop. |
| `RenderDom.stop(render)` | Stop the render loop. |

The renderer exposes coordinate mapping on `render.mapping`:

- `render.mapping.viewToWorld(value)` &mdash; convert screen coordinates to physics world coordinates
- `render.mapping.worldToView(value)` &mdash; convert physics world coordinates to screen coordinates

Both accept a scalar number or an `{ x, y }` object.

The loop only writes `style.transform` when a body has moved by more than a sub-pixel threshold since the last write, so combining it with `enableSleeping: true` on the engine makes a settled world essentially free.

### DomBodies

| Method | Description |
|---|---|
| `DomBodies.block(x, y, options)` | Create a rectangular body from a DOM element. |
| `DomBodies.circle(x, y, radius, options, maxSides)` | Create a circular body (delegates to `polygon`). |
| `DomBodies.polygon(x, y, sides, radius, options)` | Create a polygon body. |

All methods accept a `Dom` property in options:

```javascript
{
  Dom: {
    render: render,       // the RenderDom instance
    element: domElement,  // the HTML element to render
  },
  chamfer: { radius: render.mapping.viewToWorld(10) }, // 10 CSS px
}
```

`block` requires both `Dom.element` and `Dom.render`. For a circle or polygon without DOM rendering, omit `Dom` entirely; its `x` and `y` are then world coordinates.

With `Dom`, `x`/`y` place the collider's centre of mass in **CSS pixels**, relative to the element's CSS containing block. The factory sets `position: absolute; top: 0; left: 0` before measuring `offsetWidth` and `offsetHeight`. Create bodies after layout, when both dimensions are positive; give images and elements that depend on normal flow explicit CSS sizes if needed. Use a positioned scene with no border or padding as both the containing block and the mouse target.

Circle and polygon `radius` and all `chamfer.radius` values are in **world units**, not CSS pixels. At the renderer's scale, 1 world unit = 6 CSS px: a circle of radius 5 fits a 60 × 60 px element (diameter = `12 * radius`). A polygon's radius is measured to its vertices. Use `render.mapping.viewToWorld(cssPixels)` for a radius specified in pixels. Rounded corners are limited by the collider size, and the renderer rotates the element around the collider's centroid.

### DomMouseConstraint

| Method | Description |
|---|---|
| `DomMouseConstraint.create(engine, options)` | Create a mouse constraint for DOM bodies. Accepts `{ mouse, constraint, element }`. |
| `DomMouseConstraint.destroy(mouseConstraint)` | End any drag, remove the engine listener and world constraint, and detach DOM listeners installed by `create`. A mouse supplied by the caller or engine is left attached. Safe to call twice. |

Events: `startdrag`, `enddrag`, `mousemove`, `mousedown`, `mouseup`.

```javascript
import { Events } from 'matter-js';

Events.on(mouseConstraint, 'startdrag', ({ body }) => console.log('dragging', body));
Events.on(mouseConstraint, 'enddrag', ({ body }) => console.log('released', body));

// Cleanup
DomMouseConstraint.destroy(mouseConstraint);
```

## Migrating from v1

v1 registered itself through the matter.js plugin system:

```javascript
// v1
import Matter from 'matter-js';
import { MatterDomPlugin } from 'matter-dom-plugin';
Matter.use(MatterDomPlugin);
const { RenderDom, DomBodies, DomMouseConstraint } = Matter;
```

In v2, import the modules directly (see Usage above). The `#debug` wireframe renderer was removed together with the plugin's dependency on `Matter.Render`; if you need it, create a `Matter.Render` yourself alongside `RenderDom`.

## Maintainer releases

See [RELEASING.md](RELEASING.md) for versioning, changelog entries and the release command.
