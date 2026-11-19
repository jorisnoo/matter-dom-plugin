import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import test from "node:test";
import { Body, Composite, Engine, Events, Mouse, Vertices } from "matter-js";
import {
    DomBodies,
    DomMouseConstraint,
    RenderDom,
} from "../src/matter-dom-plugin.js";

function scene() {
    const engine = Engine.create();
    return { engine, render: RenderDom.create({ engine }) };
}

function element(width = 60, height = 60) {
    return { offsetWidth: width, offsetHeight: height, style: {} };
}

class MouseTarget extends EventTarget {
    getAttribute() {
        return null;
    }
}

function block(render, x = 120, y = 120, options = {}) {
    return DomBodies.block(x, y, {
        Dom: { render, element: element() },
        ...options,
    });
}

function mouseConstraint(engine, x = 120, y = 120, options = {}) {
    return DomMouseConstraint.create(engine, {
        mouse: { position: { x, y }, button: 0, sourceEvents: {} },
        ...options,
    });
}

test("block collider uses dimensions after absolute positioning", () => {
    const { render } = scene();
    const el = {
        style: {},
        get offsetWidth() {
            return this.style.position === "absolute" ? 78 : 1280;
        },
        offsetHeight: 60,
    };
    const body = block(render, 120, 120, { Dom: { render, element: el } });

    assert.equal((body.bounds.max.x - body.bounds.min.x) * 6, 78);
    assert.equal(body.Dom.halfWidth, 39);
    Composite.add(render.engine.world, body);
    RenderDom.bodies(render);
    assert.equal(el.style.transform, "translate(81px, 90px) rotate(0rad)");
});

test("factories reject incomplete DOM bindings and unmeasurable elements", () => {
    const { render } = scene();
    for (const create of [
        (options) => DomBodies.block(0, 0, options),
        (options) => DomBodies.circle(0, 0, 5, options),
        (options) => DomBodies.polygon(0, 0, 6, 5, options),
    ]) {
        for (const Dom of [null, {}, { render }, { element: element() }]) {
            assert.throws(
                () => create({ Dom }),
                /Dom\.element and Dom\.render/,
            );
        }
        for (const el of [element(0, 60), element(60, 0)]) {
            assert.throws(
                () => create({ Dom: { render, element: el } }),
                /non-zero width and height/,
            );
        }
    }
    assert.throws(() => DomBodies.block(0, 0), /Dom\.element and Dom\.render/);
    for (const body of [
        DomBodies.circle(12, 18, 5),
        DomBodies.polygon(12, 18, 3, 5),
    ]) {
        assert.equal(body.Dom, undefined);
        assert.deepEqual(body.position, { x: 12, y: 18 });
    }
});

test("rounded blocks stay convex and draggable when the radius exceeds their size", () => {
    for (const [width, height] of [
        [155, 62.2],
        [183, 73.3],
        [210, 77.8],
    ]) {
        for (const radius of [6.5, [6.5, 12, 6.5, 20], undefined]) {
            const { engine, render } = scene();
            const body = block(render, 120, 120, {
                Dom: { render, element: element(width, height) },
                chamfer: { radius },
                angle: Math.PI / 12,
                collisionFilter: { category: 2 },
            });
            const mc = mouseConstraint(engine);

            assert.equal(Vertices.isConvex(body.vertices), true);
            DomMouseConstraint.update(mc, [body]);
            assert.equal(mc.body, body);
            DomMouseConstraint.destroy(mc);
        }
    }
});

test("an asymmetrically rounded block rotates around its collider centroid", () => {
    const { engine, render } = scene();
    const el = element(600, 300);
    const body = block(render, 300, 150, {
        Dom: { render, element: el },
        chamfer: { radius: [0, 0, 25, 0] },
    });
    Composite.add(engine.world, body);

    for (const angle of [0, Math.PI / 3]) {
        Body.setAngle(body, angle);
        RenderDom.bodies(render);
        const [ox, oy] = el.style.transformOrigin.split(" ").map(parseFloat);
        const [, tx, ty, radians] = el.style.transform.match(
            /^translate\(([^,]+)px, ([^)]+)px\) rotate\(([^)]+)rad\)$/,
        );
        // Project the untouched top-left corner through the actual CSS
        // transform and compare with the corresponding physics vertex.
        const cos = Math.cos(Number(radians));
        const sin = Math.sin(Number(radians));
        const x = Number(tx) + ox - ox * cos + oy * sin;
        const y = Number(ty) + oy - ox * sin - oy * cos;
        const corner = render.mapping.worldToView(body.vertices[0]);
        assert.ok(Math.abs(x - corner.x) < 1e-8);
        assert.ok(Math.abs(y - corner.y) < 1e-8);
    }
});

test("circles choose an even side count from the view radius", () => {
    const { render } = scene();
    const options = { Dom: { render, element: element(36, 36) } };
    assert.equal(DomBodies.circle(0, 0, 3, options).vertices.length, 18);
    assert.equal(DomBodies.circle(0, 0, 3, options, 16).vertices.length, 16);
    assert.equal(DomBodies.circle(0, 0, 3).vertices.length, 10);
});

test("oversized scalar and per-corner polygon chamfers remain draggable", () => {
    const { engine, render } = scene();
    for (const create of [
        (options) => DomBodies.polygon(120, 120, 6, 5, options),
        (options) => DomBodies.circle(120, 120, 5, options),
    ]) {
        const dom = { render, element: element() };
        const sides = create({ Dom: dom }).vertices.length;
        const limit = 5 * Math.sin(Math.PI / sides);
        for (const radius of [10, [0, 10, 0, 20]]) {
            const body = create({
                Dom: { render, element: element() },
                chamfer: { radius },
            });
            assert.equal(Vertices.isConvex(body.vertices), true);
            const capped = Array.isArray(radius)
                ? radius.map((value) => Math.min(value, limit))
                : limit;
            const expected = create({ Dom: dom, chamfer: { radius: capped } });
            assert.deepEqual(
                body.vertices.map(({ x, y }) => [x, y]),
                expected.vertices.map(({ x, y }) => [x, y]),
            );
            const mc = mouseConstraint(engine);
            DomMouseConstraint.update(mc, [body]);
            assert.equal(mc.body, body);
            DomMouseConstraint.destroy(mc);
        }
    }
});

test("destroy from an event callback stops pending drag and pointer events", () => {
    for (const event of ["beforeUpdate", "startdrag", "mousemove"]) {
        const { engine, render } = scene();
        Composite.add(engine.world, block(render));
        let mc;
        const destroy = () => DomMouseConstraint.destroy(mc);
        if (event === "beforeUpdate") {
            Events.on(engine, event, destroy);
        }
        mc = mouseConstraint(engine);
        if (event !== "beforeUpdate") {
            Events.on(mc, event, destroy);
        }
        const received = [];
        Events.on(mc, "mousemove mousedown", ({ name }) => received.push(name));
        mc.mouse.sourceEvents.mousemove = new Event("mousemove");
        mc.mouse.sourceEvents.mousedown = new Event("mousedown");
        Events.trigger(engine, "beforeUpdate");
        assert.equal(mc.body, null);
        assert.deepEqual(received, event === "mousemove" ? ["mousemove"] : []);
    }
});

test("polygon fallback preserves DOM rendering and coordinate conversion", () => {
    const { render } = scene();
    const dom = { render, element: element() };
    const body = DomBodies.polygon(120, 180, 2, 5, {
        Dom: dom,
        isStatic: true,
    });
    assert.equal(body.Dom, dom);
    assert.deepEqual(body.position, { x: 20, y: 30 });
    assert.equal(body.isStatic, true);
    assert.equal(body.circleRadius, 5);
    Composite.add(render.engine.world, body);
    RenderDom.bodies(render);
    assert.equal(
        dom.element.style.transform,
        "translate(90px, 150px) rotate(0rad)",
    );
});

test("drag selection honors masks and collision groups", () => {
    const { engine, render } = scene();
    const body = block(render, 120, 120, { collisionFilter: { category: 2 } });
    const mc = mouseConstraint(engine, 120, 120, {
        collisionFilter: { mask: 0 },
    });

    DomMouseConstraint.update(mc, [body]);
    assert.equal(mc.body, null);
    mc.collisionFilter.mask = 2;
    DomMouseConstraint.update(mc, [body]);
    assert.equal(mc.body, body);
    mc.mouse.button = -1;
    DomMouseConstraint.update(mc, [body]);
    mc.mouse.button = 0;
    body.collisionFilter.group = mc.collisionFilter.group = -1;
    DomMouseConstraint.update(mc, [body]);
    assert.equal(mc.body, null);
    body.collisionFilter.group = mc.collisionFilter.group = 1;
    mc.collisionFilter.mask = 0;
    DomMouseConstraint.update(mc, [body]);
    assert.equal(mc.body, body);
});

test("drag selection rejects empty corners of rotated and circular bodies", () => {
    const { engine, render } = scene();
    const bodies = [
        block(render, 120, 120, { angle: Math.PI / 4 }),
        DomBodies.circle(120, 120, 5, { Dom: { render, element: element() } }),
    ];
    for (const body of bodies) {
        const position = {
            x: body.bounds.min.x + 0.05,
            y: body.bounds.min.y + 0.05,
        };
        assert.equal(Vertices.contains(body.vertices, position), false);
        const mc = mouseConstraint(engine, position.x * 6, position.y * 6);
        DomMouseConstraint.update(mc, [body]);
        assert.equal(mc.body, null);
        mc.mouse.position = { x: 120, y: 120 };
        DomMouseConstraint.update(mc, [body]);
        assert.equal(mc.body, body);
    }
});

test("compound DOM parts select their parent and keep dragging", () => {
    const { engine, render } = scene();
    const left = block(render);
    const right = block(render, 300, 120);
    const compound = Body.create({ parts: [left, right] });
    const mc = mouseConstraint(engine, 210, 120);

    DomMouseConstraint.update(mc, [compound]);
    assert.equal(mc.body, null, "the gap between parts is not selectable");
    mc.mouse.position = { x: 120, y: 120 };
    DomMouseConstraint.update(mc, [compound]);
    assert.equal(mc.body, compound);
    assert.equal(mc.constraint.bodyB, compound);
    mc.mouse.position = { x: 360, y: 240 };
    DomMouseConstraint.update(mc, [compound]);
    assert.deepEqual(mc.constraint.pointA, { x: 60, y: 40 });
    mc.mouse.button = -1;
    DomMouseConstraint.update(mc, [compound]);
    assert.equal(mc.body, null);
});

test("compound parts render their individual rotations", () => {
    const { engine, render } = scene();
    const left = block(render, 120, 120, { angle: Math.PI / 4 });
    const right = block(render, 300, 120);
    const compound = Body.create({ parts: [left, right] });
    Composite.add(engine.world, compound);
    RenderDom.bodies(render);
    assert.ok(
        left.Dom.element.style.transform.endsWith(`rotate(${left.angle}rad)`),
    );
    Body.setAngle(compound, Math.PI / 2);
    RenderDom.bodies(render);
    assert.ok(
        left.Dom.element.style.transform.endsWith(`rotate(${left.angle}rad)`),
    );
    assert.ok(
        right.Dom.element.style.transform.endsWith(`rotate(${right.angle}rad)`),
    );
});

test("render thresholds accumulate motion from the last actual DOM write", () => {
    const { engine, render } = scene();
    const body = block(render);
    const writes = [];
    Object.defineProperty(body.Dom.element.style, "transform", {
        set(value) {
            writes.push(value);
        },
    });
    Composite.add(engine.world, body);
    RenderDom.bodies(render);
    RenderDom.bodies(render);
    assert.equal(writes.length, 1);

    for (const axis of ["x", "y"]) {
        const count = writes.length;
        for (const expected of [count, count + 1]) {
            const delta = { x: 0, y: 0 };
            delta[axis] = render.mapping.viewToWorld(0.03);
            Body.translate(body, delta);
            RenderDom.bodies(render);
            assert.equal(writes.length, expected);
        }
    }
    Body.setAngle(body, 0.0006);
    RenderDom.bodies(render);
    assert.equal(writes.length, 3);
    Body.setAngle(body, 0.0012);
    RenderDom.bodies(render);
    assert.equal(writes.length, 4);
});

test("drag events report the parent and destroy removes the engine listener", () => {
    const { engine, render } = scene();
    const body = Body.create({
        parts: [block(render), block(render, 300, 120)],
    });
    Composite.add(engine.world, body);
    const mc = mouseConstraint(engine);
    Composite.add(engine.world, mc);
    const events = [];
    Events.on(mc, "startdrag enddrag", (event) =>
        events.push([event.name, event.body]),
    );
    Events.trigger(engine, "beforeUpdate");
    mc.mouse.button = -1;
    Events.trigger(engine, "beforeUpdate");
    assert.deepEqual(events, [
        ["startdrag", body],
        ["enddrag", body],
    ]);
    DomMouseConstraint.destroy(mc);
    mc.mouse.button = 0;
    Events.trigger(engine, "beforeUpdate");
    assert.equal(mc.body, null);
    assert.equal(events.length, 2);
});

test("destroy during a drag releases the body once and removes a nested constraint", () => {
    const { engine, render } = scene();
    const body = block(render);
    const mc = mouseConstraint(engine);
    const group = Composite.create();
    Composite.add(group, mc);
    Composite.add(engine.world, [body, group]);
    const released = [];
    Events.on(mc, "enddrag", (event) => released.push(event.body));
    Events.trigger(engine, "beforeUpdate");
    assert.equal(mc.constraint.bodyB, body);
    assert.ok(Composite.allConstraints(engine.world).includes(mc.constraint));

    DomMouseConstraint.destroy(mc);
    DomMouseConstraint.destroy(mc);
    assert.deepEqual(released, [body]);
    assert.equal(mc.body, null);
    assert.equal(mc.constraint.bodyB, null);
    assert.equal(mc.constraint.pointB, null);
    assert.ok(!Composite.allConstraints(engine.world).includes(mc.constraint));
    const startY = body.position.y;
    Engine.update(engine, 1000 / 60);
    assert.ok(body.position.y > startY);
    assert.equal(mc.body, null, "a held button cannot restart the drag");
});

test("beforeUpdate relays each pending mouse event once with the same mouse", () => {
    const { engine } = scene();
    const mc = mouseConstraint(engine);
    const names = ["mousemove", "mousedown", "mouseup"];
    const received = [];
    Events.on(mc, names.join(" "), (event) => {
        assert.equal(event.mouse, mc.mouse);
        received.push(event.name);
    });
    for (const name of names) {
        mc.mouse.sourceEvents[name] = new Event(name);
    }
    Events.trigger(engine, "beforeUpdate");
    Events.trigger(engine, "beforeUpdate");
    assert.deepEqual(received, names);
    DomMouseConstraint.destroy(mc);
});

test("supplied and engine mice are borrowed rather than disconnected", () => {
    const { engine } = scene();
    engine.mouse = Mouse.create(new MouseTarget());
    const supplied = Mouse.create(new MouseTarget());
    for (const [options, expected] of [
        [{ mouse: supplied }, supplied],
        [{}, engine.mouse],
    ]) {
        const mc = DomMouseConstraint.create(engine, options);
        assert.equal(mc.mouse, expected);
        DomMouseConstraint.destroy(mc);
        const wheel = new Event("wheel", { cancelable: true });
        expected.element.dispatchEvent(wheel);
        assert.equal(wheel.defaultPrevented, true);
        assert.equal(expected.sourceEvents.mousewheel, wheel);
    }
});

test("created mice use the scene, canvas or document fallback and detach only their listeners", (t) => {
    const { engine } = scene();
    const sceneElement = new MouseTarget();
    const canvas = new MouseTarget();
    const body = new MouseTarget();
    const original = Object.getOwnPropertyDescriptor(globalThis, "document");
    t.after(() => {
        if (original) {
            Object.defineProperty(globalThis, "document", original);
        } else {
            delete globalThis.document;
        }
    });
    globalThis.document = { body };

    for (const [options, render, target] of [
        [{ element: sceneElement }, { canvas }, sceneElement],
        [{}, { canvas }, canvas],
        [{}, undefined, body],
    ]) {
        engine.render = render;
        let wheelCount = 0;
        target.addEventListener("wheel", () => wheelCount++);
        const mc = DomMouseConstraint.create(engine, options);
        const { mouse } = mc;
        assert.equal(mouse.element, target);
        const listeners = [
            ["mousemove", mouse.mousemove],
            ["mousedown", mouse.mousedown],
            ["mouseup", mouse.mouseup],
            ["wheel", mouse.mousewheel],
            ["touchmove", mouse.mousemove],
            ["touchstart", mouse.mousedown],
            ["touchend", mouse.mouseup],
        ];
        for (const [name, handler] of listeners) {
            assert.ok(getEventListeners(target, name).includes(handler));
        }
        DomMouseConstraint.destroy(mc);
        for (const [name, handler] of listeners) {
            assert.ok(!getEventListeners(target, name).includes(handler));
        }
        const wheel = new Event("wheel", { cancelable: true });
        target.dispatchEvent(wheel);
        assert.equal(wheel.defaultPrevented, false);
        assert.equal(wheelCount, 1);
    }
});

test("run is idempotent and can restart after stop", (t) => {
    const { render } = scene();
    const pending = new Map();
    let id = 0;
    const originalRequest = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    t.after(() => {
        globalThis.requestAnimationFrame = originalRequest;
        globalThis.cancelAnimationFrame = originalCancel;
    });
    globalThis.requestAnimationFrame = (fn) => {
        pending.set(++id, fn);
        return id;
    };
    globalThis.cancelAnimationFrame = (frame) => {
        assert.ok(pending.delete(frame), "only cancel a pending frame");
    };
    RenderDom.stop(render);

    RenderDom.run(render);
    RenderDom.run(render);
    assert.equal(pending.size, 1);
    const [frame, callback] = pending.entries().next().value;
    pending.delete(frame);
    callback();
    assert.equal(pending.size, 1);
    RenderDom.stop(render);
    RenderDom.stop(render);
    assert.equal(pending.size, 0);
    assert.equal(render.frameRequestId, null);
    RenderDom.run(render);
    assert.equal(pending.size, 1);
    RenderDom.stop(render);
    assert.equal(pending.size, 0);
});
