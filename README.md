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
npm install matter-dom-plugin
```

## Usage

1. Declare physics bodies in your scene

```html
<head>
  <style>
    #block {
      width: 100px;
      height: 100px;
      background-color: red;
    }
  </style>
</head>
<body>
  <div id="block"></div>
</body>
```

2. Initialize the Matter.js world

```javascript
import { Engine, Runner, Composite, Mouse } from 'matter-js';
import { RenderDom, DomBodies, DomMouseConstraint } from 'matter-dom-plugin';

// Engine and renderer
const engine = Engine.create();
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

// Mouse drag constraint
const mouse = Mouse.create(document.body);
const mouseConstraint = DomMouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.1 },
});
Composite.add(engine.world, mouseConstraint);
```

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
  chamfer: { radius: 10 }, // optional corner rounding
}
```

When a `Dom` property with `render` and `element` is provided, the body factory will:
- Convert `x`/`y` from view to world coordinates
- Set `position: absolute` on the element
- Cache `halfWidth`/`halfHeight` for the render loop

### DomMouseConstraint

| Method | Description |
|---|---|
| `DomMouseConstraint.create(engine, options)` | Create a mouse constraint for DOM bodies. Accepts `{ mouse, constraint, element }`. |
| `DomMouseConstraint.destroy(mouseConstraint)` | Remove the `beforeUpdate` event listener from the engine. |

Events: `startdrag`, `enddrag`, `mousemove`, `mousedown`, `mouseup`.

```javascript
const mc = DomMouseConstraint.create(engine, { mouse });

Events.on(mc, 'startdrag', ({ body }) => console.log('dragging', body));
Events.on(mc, 'enddrag', ({ body }) => console.log('released', body));

// Cleanup
DomMouseConstraint.destroy(mc);
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
