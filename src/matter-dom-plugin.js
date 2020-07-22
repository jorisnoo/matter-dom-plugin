const Matter = require('matter-js');
const RenderDom = require('./render/RenderDom.js');
const DomBody = require('./body/DomBody.js');
const DomBodies = require('./factory/DomBodies.js');
const DomMouseConstraint = require('./constraint/DomMouseConstraint.js');
const Engine = require('./core/Engine.js');

const MatterDomPlugin = {
    name: 'matter-dom-plugin',
    version: '1.1.0',
    for: 'matter-js@^0.14.2',
    install: function (matter) {
        MatterDomPlugin.installRenderDom(matter);
        MatterDomPlugin.installDomBody(matter);
        MatterDomPlugin.installDomBodies(matter); // Depends on DomBody
        MatterDomPlugin.installDomMouseConstraint(matter);
        MatterDomPlugin.installEngine(matter);
    },
    installRenderDom: function (matter) {
        // console.log("Installing RenderDom module.");
        matter.RenderDom = RenderDom(matter);
    },
    installDomBodies: function (matter) {
        // console.log("Installing DomBodies module.");
        matter.DomBodies = DomBodies(matter);
    },
    installDomMouseConstraint: function (matter) {
        // console.log("Installing DomMouseConstraint.");
        matter.DomMouseConstraint = DomMouseConstraint(matter);
    },
    installDomBody: function (matter) {
        // console.log("Installing DomBody updates.");
        matter.DomBody = DomBody(matter);
    },
    installEngine: function (matter) {
        // console.log("Patching Engine.");
        Engine(matter);
    }
};


Matter.Plugin.register(MatterDomPlugin);

module.exports.MatterDomPlugin = MatterDomPlugin;
