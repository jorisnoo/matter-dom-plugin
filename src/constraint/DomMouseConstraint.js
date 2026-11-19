import {
    Bounds,
    Common,
    Composite,
    Constraint,
    Detector,
    Events,
    Mouse,
    Sleeping,
    Vertices,
} from "matter-js";

const DomMouseConstraint = {};

const _triggerEvents = function (mouseConstraint) {
    const { mouse } = mouseConstraint;
    const mouseEvents = mouse.sourceEvents;

    for (const event of ["mousemove", "mousedown", "mouseup"]) {
        if (mouseEvents[event]) {
            Events.trigger(mouseConstraint, event, { mouse });
            if (!mouseConstraint._engine) {
                return;
            }
        }
    }

    // reset the mouse state ready for the next step
    Mouse.clearSourceEvents(mouse);
};

const releaseBody = (mouseConstraint) => {
    const { body, constraint, mouse } = mouseConstraint;
    constraint.bodyB = mouseConstraint.body = null;
    constraint.pointB = null;
    mouseConstraint._viewToWorld = null;
    if (body) {
        Events.trigger(mouseConstraint, "enddrag", { mouse, body });
    }
};

DomMouseConstraint.create = function (engine, options = {}) {
    const {
        mouse: suppliedMouse,
        element,
        constraint: constraintOptions,
        ...restOptions
    } = options;
    let mouse = suppliedMouse ?? engine.mouse;
    let ownedMouseElement = null;

    if (!mouse) {
        const target = element ?? engine.render?.canvas;
        if (target) {
            mouse = Mouse.create(target);
        } else {
            mouse = Mouse.create();
            Common.warn(
                "MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected",
            );
        }
        ownedMouseElement = mouse.element;
    }

    const constraint = Constraint.create({
        label: "Mouse Constraint",
        pointA: mouse.position,
        pointB: { x: 0, y: 0 },
        length: 0.01,
        stiffness: 0.1,
        angularStiffness: 1,
        render: {
            strokeStyle: "#90EE90",
            lineWidth: 3,
        },
        ...constraintOptions,
    });

    const defaults = {
        type: "mouseConstraint",
        mouse,
        element: element ?? null,
        body: null,
        constraint,
        collisionFilter: {
            category: 0x0001,
            mask: 0xffffffff,
            group: 0,
        },
    };

    const domMouseConstraint = Common.extend(defaults, restOptions);

    const beforeUpdateHandler = function () {
        // An earlier beforeUpdate listener can destroy a constraint after
        // Matter has captured the callbacks for the current tick.
        if (!domMouseConstraint._engine) {
            return;
        }
        const allBodies = Composite.allBodies(engine.world);
        DomMouseConstraint.update(domMouseConstraint, allBodies);
        if (domMouseConstraint._engine) {
            _triggerEvents(domMouseConstraint);
        }
    };

    domMouseConstraint._engine = engine;
    domMouseConstraint._beforeUpdateHandler = beforeUpdateHandler;
    domMouseConstraint._ownedMouseElement = ownedMouseElement;

    Events.on(engine, "beforeUpdate", beforeUpdateHandler);

    return domMouseConstraint;
};

DomMouseConstraint.update = function (mouseConstraint, bodies) {
    const { mouse, constraint } = mouseConstraint;

    if (mouse.button === 0) {
        if (!constraint.bodyB) {
            for (let i = 0; i < bodies.length; i++) {
                const candidate = bodies[i];
                const parts =
                    candidate.parts.length > 1
                        ? candidate.parts.slice(1)
                        : candidate.parts;
                const dom =
                    candidate.Dom ??
                    parts.find((part) => part.Dom?.render)?.Dom;

                if (
                    !dom?.render ||
                    !Detector.canCollide(
                        candidate.collisionFilter,
                        mouseConstraint.collisionFilter,
                    )
                ) {
                    continue;
                }

                const viewToWorld = dom.render.mapping.viewToWorld;
                const mousePositionInWorld = viewToWorld(mouse.position);

                if (
                    !Bounds.contains(candidate.bounds, mousePositionInWorld) ||
                    !parts.some(
                        (part) =>
                            (candidate.Dom?.element || part.Dom?.element) &&
                            Vertices.contains(
                                part.vertices,
                                mousePositionInWorld,
                            ),
                    )
                ) {
                    continue;
                }

                mouseConstraint._viewToWorld = viewToWorld;
                constraint.pointA = mousePositionInWorld;
                constraint.bodyB = mouseConstraint.body = candidate;
                constraint.pointB = { x: 0, y: 0 };
                constraint.angleB = candidate.angle;

                Sleeping.set(candidate, false);

                Events.trigger(mouseConstraint, "startdrag", {
                    mouse,
                    body: candidate,
                });

                break;
            }
        } else {
            Sleeping.set(constraint.bodyB, false);
            const viewToWorld =
                mouseConstraint._viewToWorld ??
                (
                    constraint.bodyB.Dom ??
                    constraint.bodyB.parts.find((part) => part.Dom?.render)?.Dom
                ).render.mapping.viewToWorld;
            constraint.pointA = viewToWorld(mouse.position);
        }
    } else {
        releaseBody(mouseConstraint);
    }
};

DomMouseConstraint.destroy = function (mouseConstraint) {
    const engine = mouseConstraint._engine;
    if (!engine) {
        return;
    }
    mouseConstraint._engine = null;
    Events.off(engine, "beforeUpdate", mouseConstraint._beforeUpdateHandler);
    mouseConstraint._beforeUpdateHandler = null;
    Composite.remove(engine.world, mouseConstraint.constraint, true);

    const element = mouseConstraint._ownedMouseElement;
    if (element) {
        const { mouse } = mouseConstraint;
        element.removeEventListener("mousemove", mouse.mousemove);
        element.removeEventListener("mousedown", mouse.mousedown);
        element.removeEventListener("mouseup", mouse.mouseup);
        element.removeEventListener("wheel", mouse.mousewheel);
        element.removeEventListener("touchmove", mouse.mousemove);
        element.removeEventListener("touchstart", mouse.mousedown);
        element.removeEventListener("touchend", mouse.mouseup);
        Mouse.clearSourceEvents(mouse);
        mouseConstraint._ownedMouseElement = null;
    }

    releaseBody(mouseConstraint);
};

export default DomMouseConstraint;
