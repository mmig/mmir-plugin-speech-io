
export interface Targetable {
  target?: HTMLElement | EventTarget;
  currentTarget?: HTMLElement | EventTarget;
  [field: string]: any
}

export interface ISpeechInputIndicator {

  initialized: boolean;
  visible?: boolean;

  show(event: Targetable | any, target?: HTMLElement): void;
  toggle(event: Targetable | any, target?: HTMLElement): void;
  hide(): void;
  ready(overlayTarget?: OverlayTarget) : Promise<void>;
}

export interface ISpeechOutputIndicator {

  initialized: boolean;
  visible?: boolean;

  startReading(event: Targetable | any, target?: HTMLElement): void;
  stopReading(isLeaveOpen?: boolean): void;

  ready(overlayTarget?: OverlayTarget) : Promise<void>;
}

export interface OverlayTarget {
    target: HTMLElement;
    show: boolean;
}
