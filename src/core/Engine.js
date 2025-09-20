export default function (Matter) {
    // Patch Engine
    const Composite = Matter.Composite;
    const DomBody = Matter.DomBody;
    const Engine = Matter.Engine;

    const superUpdate = Engine.update;

    const _bodiesUpdate = function (bodies, deltaTime, timeScale, correction) {
        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];

            if (body.isStatic || body.isSleeping) {
                continue;
            }

            DomBody.update(body, deltaTime, timeScale, correction);
        }
    };

    Engine.update = function (engine, delta, correction) {
        superUpdate(engine, delta, correction);

        delta = delta || 1000 / 60;
        correction = correction || 1;

        const world = engine.world;
        const timing = engine.timing;
        const allBodies = Composite.allBodies(world);

        _bodiesUpdate(allBodies, delta, timing.timeScale, correction);
        return engine;
    };
}
