let DomBody = {};

export default function (Matter) {
    const Common = Matter.Common;
    const Body = Matter.Body;

    // Extend Body
    DomBody = Common.clone(Body, true);

    DomBody.create = function () {
        const body = Body.create.apply(null, arguments);
        return body;
    };

    DomBody.setVertices = function () {
        Body.setVertices.apply(null, arguments);
    };

    DomBody.setPosition = function () {
        Body.setPosition.apply(null, arguments);
    };

    DomBody.setAngle = function () {
        Body.setAngle.apply(null, arguments);
    };

    DomBody.scale = function () {
        Body.scale.apply(null, arguments);
    };

    DomBody.update = function () {
        Body.update.apply(null, arguments);
    };

    return DomBody;
}
