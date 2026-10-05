import assert from "node:assert/strict";
import test from "node:test";
import { Body, Composite, Engine, Events, Vertices } from "matter-js";
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
    globalThis.cancelAnimationFrame = (frame) => pending.delete(frame);

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
