import { Subscription, BehaviorSubject } from 'rxjs';
import { RecognitionEmma, UnderstandingEmma, SpeechInputStateOptions, ReadingStateOptions, StopReadingOptions, ReadingOptions, Cmd } from '../typings/';
import { FeedbackOption } from '../io/HapticFeedback';
import { PromptReader } from '../io/PromptReader';
import { SpeechInputController } from '../ctrl/SpeechInputController';
import { SpeechOutputController } from '../ctrl/SpeechOutputController';
import { DictationTargetHandler, DictationHandler, DictationTarget, SelectionMode } from '../io/SpeechDictation';
import { ReadTargetHandler } from '../io/SpeechReading';
import { EventLike } from '../typings/';
import { ISpeechInputIndicator, ISpeechOutputIndicator } from '../typings/';
import { ExtMmirModule, SpeechEventName, GuiElement, SpeechIoManager, InputOutputOption } from '../typings/';
import { MmirService } from '../mmir-service';
export declare class VoiceUIController<CmdImpl extends Cmd> {
    protected _mmirProvider: MmirService<CmdImpl>;
    protected mmir: ExtMmirModule<CmdImpl>;
    protected get speech(): SpeechIoManager<CmdImpl>;
    protected prompt: PromptReader;
    protected _asrActive: boolean;
    asrActiveChange: BehaviorSubject<boolean>;
    ttsActiveChange: BehaviorSubject<boolean>;
    /**
     * FLAG for "permanent command mode":
     * if true, speech-input for command mode will stay active on page/view changes
     * @type {boolean}
     */
    isPermanentCommandMode: boolean;
    /**
     * set dictation overlay to singleton (or not):
     * in singleton mode, overlay reference does not get reset upon leaving a view.
     */
    isDictationOverlaySingleton: boolean;
    /**
     * set read overlay to singleton (or not):
     * in singleton mode, overlay reference does not get reset upon leaving a view.
     */
    isReadOverlaySingleton: boolean;
    protected _debugMsg: boolean;
    protected readonly _defaultDictationFeedbackStyle: SelectionMode;
    get asrActive(): boolean;
    get ttsActive(): boolean;
    speechOut: SpeechOutputController;
    speechIn: SpeechInputController;
    protected activePageSubscriptions: Array<Subscription>;
    protected dictTargetHandler: DictationTargetHandler;
    protected readTargetHandler: ReadTargetHandler;
    protected dictationOverlay: ISpeechInputIndicator;
    protected readOverlay: ISpeechOutputIndicator;
    protected readOverlayClickSubscription: Subscription;
    get debug(): boolean;
    set debug(value: boolean);
    protected _speechEventSubscriptions: Map<SpeechEventName, Subscription>;
    protected initializing: Promise<VoiceUIController<CmdImpl>>;
    protected _initialized: boolean;
    get initialized(): boolean;
    constructor(mmirProvider: MmirService<CmdImpl>);
    ready(): Promise<VoiceUIController<CmdImpl>>;
    destroy(): void;
    getPromptReader(): PromptReader;
    /**
     * stop speech-input/close microphone
     *
     * @param  {boolean} leaveCommandActive
     *              if true, speech-input will not be canceled, if it is currently
     *              in command mode, or guided-input mode
     *              (i.e. only canceled if in "pure" dictation mode)
     */
    asrCancel(leaveCommandActive: boolean): void;
    ttsCancel(options?: StopReadingOptions): void;
    asrEngine(engine: string | null): void;
    ttsEngine(engine: string | null): void;
    enableBargeIn(enable: boolean): void;
    /** @deprecated use [[ enterView ]] */
    enterViewWith(): Promise<VoiceUIController<CmdImpl>>;
    /** @deprecated use [[ enterView ]] */
    enterViewWith(asrActiveHandler: ((asrActive: boolean) => void)): Promise<VoiceUIController<CmdImpl>>;
    /** @deprecated use [[ enterView ]] */
    enterViewWith(asrActiveHandler: ((asrActive: boolean) => void), ttsActiveHandler: ((ttsActive: boolean) => void)): Promise<VoiceUIController<CmdImpl>>;
    /**
     * HELPER when entering a new view / page:
     * resets handlers, subscriptions etc. from previous view and intializes handlers, subscriptions etc.
     * for the new view.
     *
     * @param  [viewSubscriptions] OPITONAL subscriptions for the newly entered view (will be canceled when leaving the view or entering a new view)
     * @return the READY promise for the VoiceUiController
     */
    enterView(viewSubscriptions?: Subscription[] | Subscription): Promise<VoiceUIController<CmdImpl>>;
    /**
     * Remembers the subscription for the current/active view, and
     * unsubscribes when #leaveView is triggered.
     *
     * If array: entries with FALSY values will be ignored.
     *
     * @param {Subscription} subscription
     */
    addViewSubscription(subscription: Subscription[] | Subscription): void;
    /**
     * HELPER for leaving a view / page:
     *
     * resets/cancels handlers, resources, subscriptions etc. from current view and intializes handlers,
     * and cancels active ASR (if not <code>isPermanentCommandMode</code>) as well as active prompts/TTS.
     */
    leaveView(): void;
    protected doUnsubscribeCurrentPage(): void;
    protected releasePageResources(): void;
    protected releaseUiResources(force: boolean): void;
    handleClick(event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, name: string, data?: any): void;
    localize(res: string): string;
    triggerTouchFeedback(_event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, feedbackOptions?: FeedbackOption): void;
    /** trigger click/touch feedback & toggle command-mode ASR */
    commandClicked(event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, btnId: string, feedbackOptions?: InputOutputOption): void;
    /** toggle command-mode ASR */
    toggleCommand(btnId: string): void;
    /**
     * trigger click/touch feedback & toggle dictation-mode ASR
     *
     * dictationClicked(event: Event, target: DictationTarget, feedbackMode?: SelectionMode)
     *
     * @param  {Event} event
     * @param  {DictationTarget | string} targetId
     *                          The dication target.
     *                          If called the first time for this target, the argument must be a DictationTarget object
     * @param  {SelectionMode} [feedbackStyle]
     *                          style for visualizing unstable/interim part of dictation result/text
     *                          DEFAULT: uses #_defaultDictationFeedbackStyle
     */
    dictationClicked(event: Event | EventLike, targetId: string | DictationTarget, feedbackStyle?: SelectionMode, touchFeedback?: InputOutputOption, replaceExistingHandler?: boolean): void;
    /** toggle dictation-mode ASR */
    toggleDictation(targetId: string | DictationTarget, feedbackStyle?: SelectionMode, replaceExistingHandler?: boolean): void;
    initDictationTarget(targetId: string | DictationTarget, feedbackStyle?: SelectionMode, replaceExistingHandler?: boolean): DictationHandler;
    /**
     * reset dication-handlers for a specific `DictationTarget` or all currently cached `DictationHandler`s
     *
     * NOTE: if destroying all `DictationHandler`s their handlers' `HTMLElements` speech-activation CSS-classes
     *       will also be reset (i.e. visually reset to no speech-active).
     *       This is __not__ done, if a specific `DictationHandler` is reset.
     *
     * @param [target]  OPTIONAL if omitted, all `DictationHandler`s, otherwise the
     *                             the `DictationHandler` for the specifed `DictationTarget` (or ID) will be reset/destroyed
     * @param [doNotResetActiveCss] OPTIONAL if `false`, will not reset the speech-activation CSS-classes
     *                                       on the UI HTMLElements of the `DictationHandler` (can/should be set, if the GUI elements are immediatly disposed anyway)
     */
    resetDictationHandlers(): void;
    resetDictationHandlers(target: string, doNotResetActiveCss?: boolean): void;
    resetDictationHandlers(target: DictationTarget, doNotResetActiveCss?: boolean): void;
    private updateCurrentDictationTarget;
    /**
     * Set the overlay for GUI feedback during dictation (speech input).
     *
     * @param  {ISpeechInputIndicator} speechOverlay
     *                         the overlay reference
     * @param  {boolean} [asSingleton] OPTIONAL
     *                        if the overlay should be used as singleton (i.e. reuse
     *                        this instance between views):
     *                        if specified, sets {@link #isDictationOverlaySingleton}
     */
    setDictationOverlay(speechOverlay: ISpeechInputIndicator, asSingleton?: boolean): void;
    private updateDictationOverlayToCurrentState;
    private updateDictationOverlay;
    private setSpeechOverlay;
    /**
     *
     * ttsClicked(event: Event, targetId?: string | ElementRef | HTMLElement)
     * ttsClicked(targetId: string | ElementRef | HTMLElement)
     *
     * @param  {Event} [event] if given, touch-feedback will be triggered
     * @param  {string | ElementRef | HTMLElement} [target]
     *                          The reading "target"/control widget (if omitted, the target of the event will be used)
     *                          (if omitted, but event is given, `event.target` will be used as reading target)
     * @param [readingData] if given, reading will be started for this reading data
     * @param [feedbackOptions] options for the touch feedback
     */
    /**
     * [ttsClicked description]
     * @param event [description]
     * @param target [description]
     */
    ttsClicked(event?: Event | string | GuiElement | HTMLElement, target?: string | GuiElement | HTMLElement, readingData?: ReadingOptions, feedbackOptions?: FeedbackOption): void;
    /**
     * [startReading description]
     * @param readingData [description]
     * @param target [description]
     */
    startReading(readingData?: ReadingOptions, target?: string | GuiElement | HTMLElement): void;
    /**
     * Set the GUI overlay feedback for active reading
     *
     * @param  {ISpeechOutputIndicator} readOverlay
     *                         the overlay reference
     * @param  {boolean} [asSingleton] OPTIONAL
     *                        if the overlay should be used as singleton (i.e. reuse
     *                        this instance between views):
     *                        if specified, sets {@link #isReadOverlaySingleton}
     */
    setReadOverlay(readOverlay: ISpeechOutputIndicator, asSingleton?: boolean): void;
    private initReadOverlayInstance;
    private clearReadOverlaySubscription;
    private updateReadOverlayToCurrentState;
    private updateReadOverlay;
    private doSetReadOverlay;
    private updateCurrentReadTarget;
    protected speechInputState(options: SpeechInputStateOptions): void;
    protected readingState(options: ReadingStateOptions): void;
    /**
     * Default implementation for `stopReading` (triggered by"reading-stopped" event):
     * cancel TTS reading, i.e. `this.ttsCancel(options)`
     *
     * NOTE: overwrite for changing the default behavior.
     *
     * @param  {StopReadingOptions} options the data specifying, which TTS engine should be stopped
     */
    stopReading(options: StopReadingOptions): void;
    /**
     * Default implementation for `cancelSpeechIO`:
     * cancel TTS reading and ASR input, i.e. `this.ttsCancel()` and `this.asrCancel(this.isPermanentCommandMode)`
     *
     * NOTE: overwrite for changing the default behavior.
     */
    cancelSpeechIO(): void;
}
