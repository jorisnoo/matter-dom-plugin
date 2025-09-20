# matter-dom-plugin

> A plugin for [matter.js](https://github.com/liabru/matter-js/)

The matter-dom-plugin aims to bring dom rendering for the Matterjs physics engine. Objects are created in a html-first declarative way so that the application logic and view are seperate.

## Features

- DOM renderer
- DOM bodies (declarative HTML)
- Mouse constraint for DOM
- Dom body composites
- Compatible with Matter.js 0.17.1 to 0.20.0

## Install

```
    npm install matter-dom-plugin
```

See matter.js on [using plugins](https://github.com/liabru/matter-js/wiki/Using-plugins)

## Running Tests

Due to browser security restrictions with ES6 modules, you need to run a local server:

```bash
# Using npm (Node.js server)
npm run serve
# Then open http://localhost:8080

# Or using Python
./serve.sh
# Then open http://localhost:8000
```

## Usage

1. Declare physics bodies in scene

```html
<head>
  <style>
    #block{
      width: 100px;
      height: 100px;
      background-color: red;
    }
  </style>
</head>
<body>
  <div id="debug"></div>
  <div id="block" matter></div>
</body>
```

2. Initialize Matterjs world

```javascript
  (function(){
    Matter.use('matter-dom-plugin');
    
    /** Aliases **/
    var Engine = Matter.Engine;
    var Runner = Matter.Runner;
    var RenderDom = Matter.RenderDom;
    var DomBodies = Matter.DomBodies;
    var MouseConstraint = Matter.MouseConstraint;
    var DomMouseConstraint = Matter.DomMouseConstraint;
    var Mouse = Matter.Mouse;
    var World = Matter.World;
    
    /** Set up engine and renderer **/
    var engine = Engine.create();
    var world = engine.world;
    var runner = Runner.create();
    Runner.run(runner, engine);
    
    var render = RenderDom.create({
      engine: engine
    });
    RenderDom.run(render);
    
    /** Initialize physics bodies **/
    var block = DomBodies.block(100, 100, {
      Dom: {
        render: render,
        element: document.querySelector('#block')
      }
    });
    World.add(world, block);
    
    /** Mouse control **/
    var mouse = Mouse.create(document.body);
    var MouseConstraint = DomMouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.1,
        render: {
          visible: false
        }
      }
    });
    
    World.add(world, MouseConstraint);
  })();
```
