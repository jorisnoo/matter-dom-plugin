// Type definitions for matter-dom-plugin

import type {
    Body,
    BodyOptions,
    ChamferOptions,
    Constraint,
    ConstraintOptions,
    Engine,
    Mouse,
    Vector,
} from 'matter-js';

export interface DomRenderMapping {
    /** World units per view px */
    ratioMultiplier: number;
    /** View px per world unit */
    ratioInverse: number;
    viewToWorld(value: number): number;
    viewToWorld(value: Vector): Vector;
    worldToView(value: number): number;
    worldToView(value: Vector): Vector;
}

export interface DomRender {
    engine: Engine;
    frameRequestId: number | null;
    mapping: DomRenderMapping;
}

export interface DomData {
    render: DomRender;
    element: HTMLElement;
    /** Cached by the body factories; used by the render loop */
    halfWidth: number;
    halfHeight: number;
}

export interface DomBody extends Body {
    Dom: DomData;
}

export interface DomBodyOptions extends BodyOptions {
    Dom: {
        render: DomRender;
        element: HTMLElement;
    };
    chamfer?: ChamferOptions;
}

export interface DomMouseConstraintOptions {
    mouse?: Mouse;
    element?: HTMLElement;
    constraint?: Partial<ConstraintOptions>;
    collisionFilter?: Partial<{ category: number; mask: number; group: number }>;
}

export interface DomMouseConstraintInstance {
    type: 'mouseConstraint';
    mouse: Mouse;
    element: HTMLElement | null;
    body: DomBody | null;
    constraint: Constraint;
}

export const RenderDom: {
    create(options: { engine: Engine }): DomRender;
    run(render: DomRender): void;
    stop(render: DomRender): void;
    bodies(render: DomRender): void;
};

export const DomBodies: {
    block(x: number, y: number, options: DomBodyOptions): DomBody;
    circle(x: number, y: number, radius: number, options: DomBodyOptions, maxSides?: number): DomBody;
    polygon(x: number, y: number, sides: number, radius: number, options: DomBodyOptions): DomBody;
};

export const DomMouseConstraint: {
    create(engine: Engine, options?: DomMouseConstraintOptions): DomMouseConstraintInstance;
    update(mouseConstraint: DomMouseConstraintInstance, bodies: Body[]): void;
    destroy(mouseConstraint: DomMouseConstraintInstance): void;
};
