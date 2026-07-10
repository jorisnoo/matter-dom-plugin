import { Composite } from "matter-js";

// Skip DOM writes for movement smaller than these thresholds (sub-pixel /
// sub-visible). Keeps settled, sleeping and static bodies from triggering
// style recalculation on every frame.
const POSITION_EPSILON = 0.05;
const ANGLE_EPSILON = 0.001;

const RenderDom = {};

RenderDom.create = function (options) {
    const render = {
        engine: null,
        frameRequestId: null,
        ...options,
    };

    const ratio = 1 / 6; // world units per view px
    const ratioInverse = 6;

    const scaleMapping = (fn) => (value) => {
        if (typeof value === "object" && value !== null) {
            return { x: fn(value.x), y: fn(value.y) };
        }
        return fn(value);
    };

    render.mapping = {
        ratioMultiplier: ratio,
        ratioInverse: ratioInverse,
        viewToWorld: scaleMapping((v) => v * ratio),
        worldToView: scaleMapping((v) => v * ratioInverse),
    };

    return render;
};

RenderDom.run = function (render) {
    (function loop() {
        render.frameRequestId = requestAnimationFrame(loop);
        RenderDom.bodies(render);
    })();
};

RenderDom.stop = function (render) {
    cancelAnimationFrame(render.frameRequestId);
    render.frameRequestId = null;
};

/**
 * Map matter world body positions to DOM element transforms.
 */
RenderDom.bodies = function (render) {
    const matterBodies = Composite.allBodies(render.engine.world);
    const ratio = render.mapping.ratioInverse;

    for (let i = 0; i < matterBodies.length; i++) {
        const matterBody = matterBodies[i];

        if (matterBody.Dom && matterBody.Dom.element) {
            RenderDom.updateElement(matterBody, matterBody.angle, ratio);
            continue;
        }

        for (
            let k = matterBody.parts.length > 1 ? 1 : 0;
            k < matterBody.parts.length;
            k++
        ) {
            const matterPart = matterBody.parts[k];

            if (matterPart.Dom && matterPart.Dom.element) {
                RenderDom.updateElement(matterPart, matterBody.angle, ratio);
            }
        }
    }
};

RenderDom.updateElement = function (part, angle, ratio) {
    const dom = part.Dom;
    const x = part.position.x * ratio - dom.halfWidth;
    const y = part.position.y * ratio - dom.halfHeight;

    if (
        dom.lastX !== undefined &&
        Math.abs(x - dom.lastX) < POSITION_EPSILON &&
        Math.abs(y - dom.lastY) < POSITION_EPSILON &&
        Math.abs(angle - dom.lastAngle) < ANGLE_EPSILON
    ) {
        return;
    }

    dom.element.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
    dom.lastX = x;
    dom.lastY = y;
    dom.lastAngle = angle;
};

export default RenderDom;
