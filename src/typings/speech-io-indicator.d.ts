
export interface ISpeechInputIndicator {

  initialized: boolean;

  show(event: any, target?: HTMLElement): void;
  toggle(event: any, target?: HTMLElement): void;
  hide(): void;
  ready(overlayTarget?: OverlayTarget) : Promise<void>;
}

export interface ISpeechOutputIndicator {

  initialized: boolean;

  startReading(event: any, target?: HTMLElement): void;
  stopReading(isLeaveOpen?: boolean): void;

  ready(overlayTarget?: OverlayTarget) : Promise<void>;
}

export interface OverlayTarget {
    target: HTMLElement;
    show: boolean;
}
