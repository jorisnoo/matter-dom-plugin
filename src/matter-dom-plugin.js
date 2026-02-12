import Matter from "matter-js";
import RenderDom from "./render/RenderDom.js";
import DomBodies from "./factory/DomBodies.js";
import DomMouseConstraint from "./constraint/DomMouseConstraint.js";

const MatterDomPlugin = {
    name: "matter-dom-plugin",
    version: "1.1.0",
    for: "matter-js@>=0.20.0",
    install: function (matter) {
        MatterDomPlugin.installRenderDom(matter);
        MatterDomPlugin.installDomBodies(matter);
        MatterDomPlugin.installDomMouseConstraint(matter);
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
};

// Only register if Matter.Plugin is available
if (Matter && Matter.Plugin) {
    Matter.Plugin.register(MatterDomPlugin);
}

export { MatterDomPlugin };
export default MatterDomPlugin;
