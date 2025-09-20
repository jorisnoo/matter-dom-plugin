import Matter from "matter-js";
import RenderDom from "./render/RenderDom.js";
import DomBody from "./body/DomBody.js";
import DomBodies from "./factory/DomBodies.js";
import DomMouseConstraint from "./constraint/DomMouseConstraint.js";
import Engine from "./core/Engine.js";

const MatterDomPlugin = {
    name: "matter-dom-plugin",
    version: "1.1.0",
    for: "matter-js@>=0.17.1",
    install: function (matter) {
        MatterDomPlugin.installRenderDom(matter);
        MatterDomPlugin.installDomBody(matter);
        MatterDomPlugin.installDomBodies(matter);
        MatterDomPlugin.installDomMouseConstraint(matter);
        MatterDomPlugin.installEngine(matter);
    },
    installRenderDom: function (matter) {
        matter.RenderDom = RenderDom(matter);
    },
    installDomBodies: function (matter) {
        matter.DomBodies = DomBodies(matter);
    },
    installDomMouseConstraint: function (matter) {
        matter.DomMouseConstraint = DomMouseConstraint(matter);
    },
    installDomBody: function (matter) {
        matter.DomBody = DomBody(matter);
    },
    installEngine: function (matter) {
        Engine(matter);
    },
};

// Only register if Matter.Plugin is available
if (Matter && Matter.Plugin) {
    Matter.Plugin.register(MatterDomPlugin);
}

export { MatterDomPlugin };
export default MatterDomPlugin;
