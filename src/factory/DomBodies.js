import { Body, Vertices } from "matter-js";

const DomBodies = {};

const prepareDom = (dom) => {
    if (dom?.element && dom.render) {
        dom.element.style.position = "absolute";
        dom.element.style.left = "0px";
        dom.element.style.top = "0px";
        dom.halfWidth = dom.element.offsetWidth / 2;
        dom.halfHeight = dom.element.offsetHeight / 2;
    }
};

const applyChamfer = (vertices, chamfer) => {
    return Vertices.chamfer(
        vertices,
        chamfer.radius,
        chamfer.quality,
        chamfer.qualityMin,
        chamfer.qualityMax,
    );
};

DomBodies.block = function (x, y, options = {}) {
    const { Dom: dom, chamfer, ...bodyOptions } = options;
    const { render } = dom;

    prepareDom(dom);
    const position = render.mapping.viewToWorld({ x, y });
    const w = render.mapping.viewToWorld(dom.halfWidth * 2);
    const h = render.mapping.viewToWorld(dom.halfHeight * 2);

    let vertices = Vertices.fromPath(`L 0 0 L ${w} 0 L ${w} ${h} L 0 ${h}`);

    if (chamfer) {
        vertices = applyChamfer(vertices, chamfer);
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
    let sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

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
    prepareDom(dom);

    const theta = (2 * Math.PI) / sides;
    let path = "";
    const offset = theta * 0.5;

    for (let i = 0; i < sides; i += 1) {
        const angle = offset + i * theta;
        const xx = Math.cos(angle) * radius;
        const yy = Math.sin(angle) * radius;

        path += `L ${xx.toFixed(3)} ${yy.toFixed(3)} `;
    }

    const position = dom?.render
        ? dom.render.mapping.viewToWorld({ x, y })
        : { x, y };

    let vertices = Vertices.fromPath(path);

    if (chamfer) {
        vertices = applyChamfer(vertices, chamfer);
    }

    const body = Body.create({
        label: "Polygon Body",
        position,
        vertices,
        ...bodyOptions,
    });

    if (dom) {
        body.Dom = dom;
    }

    return body;
};

export default DomBodies;
