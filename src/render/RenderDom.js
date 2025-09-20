export default function (Matter) {
    const Common = Matter.Common;
    const Composite = Matter.Composite;
    const Events = Matter.Events;
    const Render = Matter.Render;

    const RenderDom = {};

    RenderDom.create = function (options) {
        const defaults = {
            engine: null,
            element: window,
            controller: RenderDom,
            frameRequestId: null,
            options: {},
        };

        const engine = options.engine;

        const render = Common.extend(defaults, options);

        render.mapping = {};
        render.mapping.ratioMultiplier = 1 / 6; // VIEW is base ratio. Mapping to World.
        render.mapping.VIEW = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        render.mapping.VIEW.center = {
            x: render.mapping.VIEW.width / 2,
            y: render.mapping.VIEW.height / 2,
        };
        render.mapping.WORLD = {
            width: render.mapping.VIEW.width * render.mapping.ratioMultiplier,
            height: render.mapping.VIEW.height * render.mapping.ratioMultiplier,
        };
        render.mapping.WORLD.center = {
            x: render.mapping.WORLD.width / 2,
            y: render.mapping.WORLD.height / 2,
        };
        render.mapping.viewToWorld = function (value) {
            if (typeof value === "object" && value !== null) {
                return {
                    x: render.mapping.ratioMultiplier * value.x,
                    y: render.mapping.ratioMultiplier * value.y,
                };
            } else {
                return render.mapping.ratioMultiplier * value;
            }
        };
        render.mapping.worldToView = function (value) {
            if (typeof value === "object" && value !== null) {
                return {
                    x: value.x / render.mapping.ratioMultiplier,
                    y: value.y / render.mapping.ratioMultiplier,
                };
            } else {
                return value / render.mapping.ratioMultiplier;
            }
        };

        const debugElement = document.querySelector("#debug");

        if (debugElement) {
            debugElement.style.position = "absolute";
            const debugRender = Render.create({
                element: document.querySelector("#debug"),
                engine: engine,
                options: {
                    width: render.mapping.WORLD.width,
                    height: render.mapping.WORLD.height,
                    background: "#fafafa",
                    wireframeBackground: "#222",
                    hasBounds: false,
                    enabled: true,
                    wireframes: true,
                    showSleeping: true,
                    showDebug: false,
                    showBroadphase: false,
                    showBounds: false,
                    showVelocity: false,
                    showCollisions: false,
                    showAxes: false,
                    showPositions: false,
                    showAngleIndicator: false,
                    showIds: false,
                    showShadows: false,
                },
            });

            Render.run(debugRender);

            render.DebugRender = debugRender;
        }

        return render;
    };

    RenderDom.run = function (render) {
        const self = RenderDom;
        (function loop() {
            render.frameRequestId = requestAnimationFrame(loop);
            self.world(render);
        })();
    };

    RenderDom.stop = function (render) {
        cancelAnimationFrame(render.frameRequestId);
    };

    RenderDom.world = function (render) {
        const engine = render.engine;
        const domBodies = document.querySelectorAll("[matter]");

        const event = {
            timestamp: engine.timing.timestamp,
        };

        Events.trigger(render, "beforeRender", event);

        RenderDom.bodies(render, domBodies);
    };

    /**
     * Map Dom view elements position to matter world bodys position
     */
    RenderDom.bodies = function (render) {
        const engine = render.engine;
        const world = engine.world;
        const matterBodies = Composite.allBodies(world);

        for (let i = 0; i < matterBodies.length; i++) {
            const matterBody = matterBodies[i];

            // Check if the body itself has Dom property (for simple bodies)
            if (matterBody.Dom && matterBody.Dom.element) {
                const domElement = matterBody.Dom.element;

                const bodyWorldPoint = render.mapping.worldToView({
                    x: matterBody.position.x,
                    y: matterBody.position.y,
                });
                const bodyViewOffset = {
                    x: domElement.offsetWidth / 2,
                    y: domElement.offsetHeight / 2,
                };
                domElement.style.position = "absolute";
                domElement.style.transform = `translate(${bodyWorldPoint.x - bodyViewOffset.x}px, ${
                    bodyWorldPoint.y - bodyViewOffset.y
                }px)`;
                domElement.style.transform += `rotate(${matterBody.angle}rad)`;
            } else {
                // Check parts for composite bodies
                for (
                    let k = matterBody.parts.length > 1 ? 1 : 0;
                    k < matterBody.parts.length;
                    k++
                ) {
                    const matterPart = matterBody.parts[k];

                    if (matterPart.Dom && matterPart.Dom.element) {
                        const domPart = matterPart.Dom.element;

                        const bodyWorldPoint = render.mapping.worldToView({
                            x: matterPart.position.x,
                            y: matterPart.position.y,
                        });
                        const bodyViewOffset = {
                            x: domPart.offsetWidth / 2,
                            y: domPart.offsetHeight / 2,
                        };
                        domPart.style.position = "absolute";
                        domPart.style.transform = `translate(${bodyWorldPoint.x - bodyViewOffset.x}px, ${
                            bodyWorldPoint.y - bodyViewOffset.y
                        }px)`;
                        domPart.style.transform += `rotate(${matterBody.angle}rad)`;
                    }
                }
            }
        }
    };

    return RenderDom;
}
