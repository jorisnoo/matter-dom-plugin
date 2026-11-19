// Type definitions for matter-dom-plugin

import type {
    Body,
    BodyOptions,
    ChamferOptions,
    CollisionFilter,
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
    /** CSS rotation pivot in px from the element's top-left corner */
    originX?: number;
    originY?: number;
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
    body: Body | null;
    constraint: Constraint;
    collisionFilter: CollisionFilter;
}

export const RenderDom: {
    create(options: { engine: Engine }): DomRender;
    run(render: DomRender): void;
    stop(render: DomRender): void;
    bodies(render: DomRender): void;
};

export const DomBodies: {
    /** With Dom, x and y are scene-local CSS pixels; radii are always world units. */
    block(x: number, y: number, options: DomBodyOptions): DomBody;
    circle(x: number, y: number, radius: number, options: DomBodyOptions, maxSides?: number): DomBody;
    circle(x: number, y: number, radius: number, options?: BodyOptions & { Dom?: never }, maxSides?: number): Body;
    polygon(x: number, y: number, sides: number, radius: number, options: DomBodyOptions): DomBody;
    polygon(x: number, y: number, sides: number, radius: number, options?: BodyOptions & { Dom?: never }): Body;
};

export const DomMouseConstraint: {
    create(engine: Engine, options?: DomMouseConstraintOptions): DomMouseConstraintInstance;
    update(mouseConstraint: DomMouseConstraintInstance, bodies: Body[]): void;
    /** Ends the drag, removes the constraint and detaches input listeners on an owned mouse. */
    destroy(mouseConstraint: DomMouseConstraintInstance): void;
};
