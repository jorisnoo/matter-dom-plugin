let DomMouseConstraint = {};

export default function (Matter) {
    const Sleeping = Matter.Sleeping;
    const Mouse = Matter.Mouse;
    const Events = Matter.Events;
    const Constraint = Matter.Constraint;
    const Composite = Matter.Composite;
    const Common = Matter.Common;
    const Bounds = Matter.Bounds;

    DomMouseConstraint.create = function (engine, options) {
        let mouse =
            (engine ? engine.mouse : null) || (options ? options.mouse : null);

        if (!mouse) {
            if (engine && engine.render && engine.render.canvas) {
                mouse = Mouse.create(engine.render.canvas);
            } else if (options && options.element) {
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
            mouse: mouse,
            element: null,
            body: null,
            constraint: constraint,
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
        const mouse = mouseConstraint.mouse;
        const constraint = mouseConstraint.constraint;
        let body = mouseConstraint.body;

        let mousePositionInWorld;
        if (mouse.button === 0) {
            if (!constraint.bodyB) {
                for (let i = 0; i < bodies.length; i++) {
                    body = bodies[i];

                    if (body.Dom !== undefined) {
                        mousePositionInWorld =
                            body.Dom.render.mapping.viewToWorld(mouse.position);
                        if (
                            Bounds.contains(body.bounds, mousePositionInWorld)
                        ) {
                            constraint.pointA = mousePositionInWorld;
                            constraint.bodyB = mouseConstraint.body = body;
                            constraint.pointB = { x: 0, y: 0 };
                            constraint.angleB = body.angle;

                            Events.trigger(mouseConstraint, "startdrag", {
                                mouse: mouse,
                                body: body,
                            });

                            break;
                        }
                    }
                }
            } else {
                Sleeping.set(constraint.bodyB, false);
                mousePositionInWorld = body.Dom.render.mapping.viewToWorld(
                    mouse.position,
                );
                constraint.pointA = mousePositionInWorld;
            }
        } else {
            constraint.bodyB = mouseConstraint.body = null;
            constraint.pointB = null;

            if (body) {
                Events.trigger(mouseConstraint, "enddrag", {
                    mouse: mouse,
                    body: body,
                });
            }
        }
    };

    const _triggerEvents = function (mouseConstraint) {
        const mouse = mouseConstraint.mouse;
        const mouseEvents = mouse.sourceEvents;

        if (mouseEvents.mousemove) {
            Events.trigger(mouseConstraint, "mousemove", { mouse: mouse });
        }

        if (mouseEvents.mousedown) {
            Events.trigger(mouseConstraint, "mousedown", { mouse: mouse });
        }

        if (mouseEvents.mouseup) {
            Events.trigger(mouseConstraint, "mouseup", { mouse: mouse });
        }

        // reset the mouse state ready for the next step
        Mouse.clearSourceEvents(mouse);
    };

    return DomMouseConstraint;
}
