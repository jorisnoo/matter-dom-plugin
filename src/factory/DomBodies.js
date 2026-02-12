export default function (Matter) {
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Vertices = Matter.Vertices;
    const Common = Matter.Common;

    const DomBodies = {};

    DomBodies.block = function (x, y, options) {
        const defaults = {
            Dom: {
                element: null,
                render: null,
            },
        };
        options = options || {};
        options = Common.extend(defaults, options);

        const render = options.Dom.render;
        const element = options.Dom.element;
        const dom = options.Dom;
        delete options.Dom;

        const positionInWorld = render.mapping.viewToWorld({
            x: x,
            y: y,
        });

        const elementDimensionsInWorld = render.mapping.viewToWorld({
            x: element.offsetWidth,
            y: element.offsetHeight,
        });

        const w = elementDimensionsInWorld.x;
        const h = elementDimensionsInWorld.y;

        const block = {
            label: "DOM Block Body",
            position: { x: positionInWorld.x, y: positionInWorld.y },
            vertices: Vertices.fromPath(
                `L 0 0 L ${w} 0 L ${w} ${h} L 0 ${h}`,
            ),
        };

        if (options.chamfer) {
            const chamfer = options.chamfer;
            block.vertices = Vertices.chamfer(
                block.vertices,
                chamfer.radius,
                chamfer.quality,
                chamfer.qualityMin,
                chamfer.qualityMax,
            );
            delete options.chamfer;
        }

        element.style.position = "absolute";

        const body = Body.create(Common.extend({}, block, options));
        body.Dom = dom;

        return body;
    };

    DomBodies.circle = function (x, y, radius, options, maxSides) {
        options = options || {};

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
        options = options || {};

        const dom = options.Dom;
        delete options.Dom;

        if (sides < 3) {
            return Bodies.circle(x, y, radius, options);
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
            position: { x: x, y: y },
            vertices: Vertices.fromPath(path),
        };

        if (options.chamfer) {
            const chamfer = options.chamfer;
            polygon.vertices = Vertices.chamfer(
                polygon.vertices,
                chamfer.radius,
                chamfer.quality,
                chamfer.qualityMin,
                chamfer.qualityMax,
            );
            delete options.chamfer;
        }

        const body = Body.create(Common.extend({}, polygon, options));

        if (dom) {
            body.Dom = dom;
        }

        return body;
    };

    return DomBodies;
}
