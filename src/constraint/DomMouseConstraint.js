export default function (Matter) {
    const { Sleeping, Mouse, Events, Constraint, Composite, Common, Bounds } = Matter;

    const DomMouseConstraint = {};

    const _triggerEvents = function (mouseConstraint) {
        const { mouse } = mouseConstraint;
        const mouseEvents = mouse.sourceEvents;

        for (const event of ["mousemove", "mousedown", "mouseup"]) {
            if (mouseEvents[event]) {
                Events.trigger(mouseConstraint, event, { mouse });
            }
        }

        // reset the mouse state ready for the next step
        Mouse.clearSourceEvents(mouse);
    };

    DomMouseConstraint.create = function (engine, options) {
        let mouse = engine?.mouse ?? options?.mouse;

        if (!mouse) {
            if (engine?.render?.canvas) {
                mouse = Mouse.create(engine.render.canvas);
            } else if (options?.element) {
                mouse = Mouse.create(options.element);
            } else {
                mouse = Mouse.create();
                Common.warn(
                    "MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected",
                );
            }
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
        });

        const defaults = {
            type: "mouseConstraint",
            mouse,
            element: null,
            body: null,
            constraint,
            collisionFilter: {
                category: 0x0001,
                mask: 0xffffffff,
                group: 0,
            },
        };

        const domMouseConstraint = Common.extend(defaults, options);

        Events.on(engine, "beforeUpdate", function () {
            const allBodies = Composite.allBodies(engine.world);
            DomMouseConstraint.update(domMouseConstraint, allBodies);
            _triggerEvents(domMouseConstraint);
        });

        return domMouseConstraint;
    };

    DomMouseConstraint.update = function (mouseConstraint, bodies) {
        const { mouse } = mouseConstraint;
        const { constraint } = mouseConstraint;
        const { body } = mouseConstraint;

        let mousePositionInWorld;
        if (mouse.button === 0) {
            if (!constraint.bodyB) {
                for (let i = 0; i < bodies.length; i++) {
                    const candidate = bodies[i];

                    if (candidate.Dom !== undefined) {
                        mousePositionInWorld =
                            candidate.Dom.render.mapping.viewToWorld(mouse.position);
                        if (
                            Bounds.contains(candidate.bounds, mousePositionInWorld)
                        ) {
                            constraint.pointA = mousePositionInWorld;
                            constraint.bodyB = mouseConstraint.body = candidate;
                            constraint.pointB = { x: 0, y: 0 };
                            constraint.angleB = candidate.angle;

                            Events.trigger(mouseConstraint, "startdrag", {
                                mouse,
                                body: candidate,
                            });

                            break;
                        }
                    }
                }
            } else {
                Sleeping.set(constraint.bodyB, false);
                mousePositionInWorld = constraint.bodyB.Dom.render.mapping.viewToWorld(
                    mouse.position,
                );
                constraint.pointA = mousePositionInWorld;
            }
        } else {
            constraint.bodyB = mouseConstraint.body = null;
            constraint.pointB = null;

            if (body) {
                Events.trigger(mouseConstraint, "enddrag", {
                    mouse,
                    body,
                });
            }
        }
    };

    return DomMouseConstraint;
}
