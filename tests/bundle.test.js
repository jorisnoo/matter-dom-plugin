import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

test("a browser bundle uses one engine and tree-shakes the canvas renderer", async () => {
    const { outputFiles, metafile } = await build({
        stdin: {
            contents: `
        import { Body, Engine } from 'matter-js';
        import { DomBodies, RenderDom } from 'matter-dom-plugin';
        const engine = Engine.create();
        const render = RenderDom.create({ engine });
        const element = { style: {}, offsetWidth: 60, offsetHeight: 30 };
        export const body = DomBodies.block(60, 30, { Dom: { render, element } });
        export { Body };
      `,
            resolveDir: process.cwd(),
        },
        platform: "browser",
        bundle: true,
        format: "esm",
        metafile: true,
        write: false,
    });
    const inputs = Object.values(metafile.outputs)[0].inputs;
    assert.ok(
        Object.keys(inputs).some((name) => name.endsWith("/src/body/Body.js")),
    );
    assert.ok(
        !Object.keys(inputs).some(
            (name) =>
                name.endsWith("/src/render/Render.js") &&
                inputs[name].bytesInOutput,
        ),
    );
    const { Body, body } = await import(
        `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString("base64")}`
    );
    assert.ok(body instanceof Body);
    assert.deepEqual(body.position, { x: 10, y: 5 });
});
