import { Body, Vertices } from "matter-js";

const DomBodies = {};

const prepareDom = (dom) => {
    if (!dom?.element?.style || !dom.render?.mapping) {
        throw new TypeError("DomBodies requires Dom.element and Dom.render");
    }
    dom.element.style.position = "absolute";
    dom.element.style.left = "0px";
    dom.element.style.top = "0px";
    dom.halfWidth = dom.element.offsetWidth / 2;
    dom.halfHeight = dom.element.offsetHeight / 2;
    if (!(dom.halfWidth > 0 && dom.halfHeight > 0)) {
        throw new RangeError(
            "Dom.element needs a non-zero width and height; set its CSS size or create the body after layout",
        );
    }
};

// Body.create recentres the vertices on their centroid. The CSS rotation
// pivot and translation must use that same point in the element's border box.
const setOrigin = (dom, x, y) => {
    dom.originX = x;
    dom.originY = y;
    dom.element.style.transformOrigin = `${x}px ${y}px`;
    dom.lastX = undefined;
};

const applyChamfer = (vertices, chamfer, maxRadius) => {
    const radius = chamfer.radius ?? 8;
    const clamp = (value) => Math.max(0, Math.min(value, maxRadius));
    return Vertices.chamfer(
        vertices,
        Array.isArray(radius) ? radius.map(clamp) : clamp(radius),
        chamfer.quality,
        chamfer.qualityMin,
        chamfer.qualityMax,
    );
};

DomBodies.block = function (x, y, options = {}) {
    const { Dom: dom, chamfer, ...bodyOptions } = options;

    prepareDom(dom);
    const { render } = dom;
    const position = render.mapping.viewToWorld({ x, y });
    const w = render.mapping.viewToWorld(dom.halfWidth * 2);
    const h = render.mapping.viewToWorld(dom.halfHeight * 2);

    let vertices = Vertices.fromPath(`L 0 0 L ${w} 0 L ${w} ${h} L 0 ${h}`);

    if (chamfer) {
        vertices = applyChamfer(vertices, chamfer, Math.min(w, h) / 2);
        const origin = render.mapping.worldToView(Vertices.centre(vertices));
        setOrigin(dom, origin.x, origin.y);
    } else {
        setOrigin(dom, dom.halfWidth, dom.halfHeight);
    }

    const body = Body.create({
        label: "DOM Block Body",
        position,
        vertices,
        ...bodyOptions,
    });

    body.Dom = dom;

    return body;
};

DomBodies.circle = function (x, y, radius, options = {}, maxSides) {
    maxSides = maxSides || 25;
    const viewRadius =
        radius * (options.Dom?.render?.mapping?.ratioInverse ?? 1);
    let sides = Math.ceil(Math.max(10, Math.min(maxSides, viewRadius)));

    if (sides % 2 === 1) {
        sides += 1;
    }

    return DomBodies.polygon(x, y, sides, radius, {
        label: "Circle Body",
        circleRadius: radius,
        ...options,
    });
};

DomBodies.polygon = function (x, y, sides, radius, options = {}) {
    if (sides < 3) {
        return DomBodies.circle(x, y, radius, options);
    }

    const { Dom: dom, chamfer, ...bodyOptions } = options;
    if (dom !== undefined) {
        prepareDom(dom);
    }

    const theta = (2 * Math.PI) / sides;
    let path = "";
    const offset = theta * 0.5;

    for (let i = 0; i < sides; i += 1) {
        const angle = offset + i * theta;
        const xx = Math.cos(angle) * radius;
        const yy = Math.sin(angle) * radius;

        path += `L ${xx.toFixed(3)} ${yy.toFixed(3)} `;
    }

    const position = dom ? dom.render.mapping.viewToWorld({ x, y }) : { x, y };

    let vertices = Vertices.fromPath(path);

    if (chamfer) {
        vertices = applyChamfer(vertices, chamfer, radius * Math.sin(offset));
        // Matter's sampled corner arcs can still form an inward turn where
        // unequal radii meet. Its collision and picking APIs need a convex hull.
        if (!Vertices.isConvex(vertices)) {
            vertices = Vertices.hull(vertices);
        }
    }

    const body = Body.create({
        label: "Polygon Body",
        position,
        vertices,
        ...bodyOptions,
    });

    if (dom) {
        if (chamfer) {
            const centre = Vertices.centre(vertices);
            const offset = dom.render.mapping.worldToView(centre);
            setOrigin(dom, dom.halfWidth + offset.x, dom.halfHeight + offset.y);
        } else {
            setOrigin(dom, dom.halfWidth, dom.halfHeight);
        }
        body.Dom = dom;
    }

    return body;
};

export default DomBodies;
