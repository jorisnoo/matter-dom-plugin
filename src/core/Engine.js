module.exports = function(Matter){

    // Patch Engine
    const Composite = Matter.Composite;
    const DomBody = Matter.DomBody;
    const Engine = Matter.Engine;

    let superUpdate = Engine.update;

    let _bodiesUpdate = function(bodies, deltaTime, timeScale, correction) {
        for (let i = 0; i < bodies.length; i++) {
            let body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            DomBody.update(body, deltaTime, timeScale, correction);
        }
    };

    Engine.update = function(engine, delta, correction){
        superUpdate(engine, delta, correction);

        delta = delta || 1000 / 60;
        correction = correction || 1;

        let world = engine.world;
        let timing = engine.timing;
        let allBodies = Composite.allBodies(world);


        _bodiesUpdate(allBodies, delta, timing.timeScale, correction, world.bounds);
        return engine;
    };
};
