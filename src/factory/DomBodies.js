let DomBodies = {};

export default function (Matter) {
    const Bodies = Matter.Bodies;
    const DomBody = Matter.DomBody;
    const Vertices = Matter.Vertices;
    const Common = Matter.Common;
    const World = Matter.World;

    DomBodies.create = function (options) {
        const bodyType = options.bodyType; // Required
        const el = options.el; // Required
        const render = options.render; // Required
        const position = options.position; // Required

        delete options.bodyType;
        delete options.render;
        delete options.position;

        options.domRenderer = render;

        let worldBody = null;
        const domBody = document.querySelector(el);

        const positionInWorld = render.mapping.viewToWorld({ x: position.x, y: position.y });

        if (bodyType === 'block') {
            const blockDimensionsInWorld = render.mapping.viewToWorld({
                x: domBody.offsetWidth,
                y: domBody.offsetHeight,
            });

            worldBody = DomBodies.OGblock(
                positionInWorld.x,
                positionInWorld.y,
                blockDimensionsInWorld.x,
                blockDimensionsInWorld.y,
                options
            );
        } else if (bodyType === 'circle') {
            const circleRadiusInWorld = render.mapping.viewToWorld(domBody.offsetWidth / 2);

            worldBody = DomBodies.circle(
                positionInWorld.x,
                positionInWorld.y,
                circleRadiusInWorld,
                options
            );
        }

        if (worldBody) {
            World.add(render.engine.world, [worldBody]);
        }

        return worldBody;
    };

    DomBodies.OGblock = function (x, y, width, height, options) {
        options = options || {};

        const block = {
            label: 'Block Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(
                'L 0 0 L ' + width + ' 0 L ' + width + ' ' + height + ' L 0 ' + height
            ),
        };

        if (options.chamfer) {
            const chamfer = options.chamfer;
            block.vertices = Vertices.chamfer(
                block.vertices,
                chamfer.radius,
                chamfer.quality,
                chamfer.qualityMin,
                chamfer.qualityMax
            );
            delete options.chamfer;
        }
        return DomBody.create(Common.extend({}, block, options));
    };

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
        const positionInWorld = render.mapping.viewToWorld({
            x: x,
            y: y,
        });

        const elementDimensionsInWorld = render.mapping.viewToWorld({
            x: element.offsetWidth,
            y: element.offsetHeight,
        });

        const block = {
            label: 'DOM Block Body',
            position: { x: positionInWorld.x, y: positionInWorld.y },
            vertices: Vertices.fromPath(
                'L 0 0 L ' +
                    elementDimensionsInWorld.x +
                    ' 0 L ' +
                    elementDimensionsInWorld.x +
                    ' ' +
                    elementDimensionsInWorld.y +
                    ' L 0 ' +
                    elementDimensionsInWorld.y
            ),
        };

        if (options.chamfer) {
            const chamfer = options.chamfer;
            block.vertices = Vertices.chamfer(
                block.vertices,
                chamfer.radius,
                chamfer.quality,
                chamfer.qualityMin,
                chamfer.qualityMax
            );
            delete options.chamfer;
        }

        const body = DomBody.create(Common.extend({}, block, options));

        return body;
    };

    DomBodies.circle = function (x, y, radius, options, maxSides) {
        options = options || {};

        const circle = {
            label: 'Circle Body',
            circleRadius: radius,
        };

        // approximate circles with polygons until true circles implemented in SAT
        maxSides = maxSides || 25;
        let sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

        // optimisation: always use even number of sides (half the number of unique axes)
        if (sides % 2 === 1) {
            sides += 1;
        }

        return DomBodies.polygon(x, y, sides, radius, Common.extend({}, circle, options));
    };

    DomBodies.polygon = function (x, y, sides, radius, options) {
        options = options || {};

        if (sides < 3) {
            return Bodies.circle(x, y, radius, options);
        }

        const theta = (2 * Math.PI) / sides;
        let path = '';
        const offset = theta * 0.5;

        for (let i = 0; i < sides; i += 1) {
            const angle = offset + i * theta;
            const xx = Math.cos(angle) * radius;
            const yy = Math.sin(angle) * radius;

            path += 'L ' + xx.toFixed(3) + ' ' + yy.toFixed(3) + ' ';
        }

        const polygon = {
            label: 'Polygon Body',
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
                chamfer.qualityMax
            );
            delete options.chamfer;
        }

        return DomBody.create(Common.extend({}, polygon, options));
    };

    return DomBodies;
}
