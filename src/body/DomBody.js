export default function (Matter) {
    const Common = Matter.Common;
    const Body = Matter.Body;

    // Extend Body
    let DomBody = Common.clone(Body, true);

    DomBody.create = function (...args) {
        return Body.create(...args);
    };

    DomBody.setVertices = function (...args) {
        Body.setVertices(...args);
    };

    DomBody.setPosition = function (...args) {
        Body.setPosition(...args);
    };

    DomBody.setAngle = function (...args) {
        Body.setAngle(...args);
    };

    DomBody.scale = function (...args) {
        Body.scale(...args);
    };

    DomBody.update = function (...args) {
        Body.update(...args);
    };

    return DomBody;
}
