export default function (Matter) {
    const { Common, Composite, Events, Render } = Matter;

    const RenderDom = {};

    RenderDom.create = function (options) {
        const defaults = {
            engine: null,
            element: window,
            frameRequestId: null,
            options: {},
        };

        const engine = options.engine;

        const render = Common.extend(defaults, options);
        render.engine = options.engine; // Preserve reference (Common.extend deep-clones objects)

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

        const ratio = render.mapping.ratioMultiplier;
        render.mapping.ratioInverse = 1 / ratio;
        const ratioInverse = render.mapping.ratioInverse;

        const scaleMapping = (fn) => (value) => {
            if (typeof value === "object" && value !== null) {
                return { x: fn(value.x), y: fn(value.y) };
            }
            return fn(value);
        };

        render.mapping.viewToWorld = scaleMapping((v) => ratio * v);
        render.mapping.worldToView = scaleMapping((v) => v * ratioInverse);

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
        (function loop() {
            render.frameRequestId = requestAnimationFrame(loop);
            RenderDom.world(render);
        })();
    };

    RenderDom.stop = function (render) {
        cancelAnimationFrame(render.frameRequestId);
        if (render.DebugRender) {
            Render.stop(render.DebugRender);
        }
    };

    RenderDom.world = function (render) {
        Events.trigger(render, "beforeRender", {
            timestamp: render.engine.timing.timestamp,
        });

        RenderDom.bodies(render);
    };

    /**
     * Map Dom view elements position to matter world bodys position
     */
    RenderDom.bodies = function (render) {
        const matterBodies = Composite.allBodies(render.engine.world);
        const ratio = render.mapping.ratioInverse;

        for (let i = 0; i < matterBodies.length; i++) {
            const matterBody = matterBodies[i];

            if (matterBody.Dom && matterBody.Dom.element) {
                const x = matterBody.position.x * ratio - matterBody.Dom.halfWidth;
                const y = matterBody.position.y * ratio - matterBody.Dom.halfHeight;

                matterBody.Dom.element.style.transform = `translate(${x}px, ${y}px) rotate(${matterBody.angle}rad)`;
                continue;
            }

            for (
                let k = matterBody.parts.length > 1 ? 1 : 0;
                k < matterBody.parts.length;
                k++
            ) {
                const matterPart = matterBody.parts[k];

                if (matterPart.Dom && matterPart.Dom.element) {
                    const x = matterPart.position.x * ratio - matterPart.Dom.halfWidth;
                    const y = matterPart.position.y * ratio - matterPart.Dom.halfHeight;

                    matterPart.Dom.element.style.transform = `translate(${x}px, ${y}px) rotate(${matterBody.angle}rad)`;
                }
            }
        }
    };

    return RenderDom;
}
