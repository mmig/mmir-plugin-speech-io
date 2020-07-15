import { GuiElement } from '../typings/';
export declare class ReadTargetHandler {
    activeHandler: ReadHandler;
    private targets;
    constructor();
    get(id: string): ReadHandler;
    tryGetAndPut(targetId: string | GuiElement, event?: Event): ReadHandler;
    has(id: string): boolean;
    put(id: string, el: ReadHandler): void;
    reset(): void;
    apply(func: (handler: ReadHandler) => void): void;
    destroy(): void;
}
export declare class ReadHandler {
    id: string;
    ctrl: HTMLElement;
    error: string;
    constructor(id: string, ctrl: HTMLElement);
    destroy(): void;
}
