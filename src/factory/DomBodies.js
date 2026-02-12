export default function (Matter) {
    const { Body, Bodies, Vertices, Common } = Matter;

    const DomBodies = {};

    DomBodies.block = function (x, y, options) {
        const defaults = {
            Dom: {
                element: null,
                render: null,
            },
        };
        options ??= {};
        options = Common.extend(defaults, options);

        const { Dom: dom, chamfer, ...bodyOptions } = options;
        const { render, element } = dom;

        const positionInWorld = render.mapping.viewToWorld({ x, y });

        const elementDimensionsInWorld = render.mapping.viewToWorld({
            x: element.offsetWidth,
            y: element.offsetHeight,
        });

        const w = elementDimensionsInWorld.x;
        const h = elementDimensionsInWorld.y;

        const block = {
            label: "DOM Block Body",
            position: positionInWorld,
            vertices: Vertices.fromPath(
                `L 0 0 L ${w} 0 L ${w} ${h} L 0 ${h}`,
            ),
        };

        if (chamfer) {
            block.vertices = Vertices.chamfer(
                block.vertices,
                chamfer.radius,
                chamfer.quality,
                chamfer.qualityMin,
                chamfer.qualityMax,
            );
        }

        element.style.position = "absolute";

        const body = Body.create(Common.extend({}, block, bodyOptions));
        body.Dom = dom;
        body.Dom.halfWidth = element.offsetWidth / 2;
        body.Dom.halfHeight = element.offsetHeight / 2;

        return body;
    };

    DomBodies.circle = function (x, y, radius, options, maxSides) {
        options ??= {};

        const circle = {
            label: "Circle Body",
            circleRadius: radius,
        };

        maxSides = maxSides || 25;
        let sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

        if (sides % 2 === 1) {
            sides += 1;
        }

        return DomBodies.polygon(
            x,
            y,
            sides,
            radius,
            Common.extend({}, circle, options),
        );
    };

    DomBodies.polygon = function (x, y, sides, radius, options) {
        options ??= {};

        const { Dom: dom, chamfer, ...bodyOptions } = options;

        if (sides < 3) {
            return Bodies.circle(x, y, radius, bodyOptions);
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

        const polygon = {
            label: "Polygon Body",
            position: { x, y },
            vertices: Vertices.fromPath(path),
        };

        if (chamfer) {
            polygon.vertices = Vertices.chamfer(
                polygon.vertices,
                chamfer.radius,
                chamfer.quality,
                chamfer.qualityMin,
                chamfer.qualityMax,
            );
        }

        const body = Body.create(Common.extend({}, polygon, bodyOptions));

        if (dom) {
            body.Dom = dom;
        }

        return body;
    };

    return DomBodies;
}
