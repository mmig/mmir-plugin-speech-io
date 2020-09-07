import { Subscription, BehaviorSubject } from 'rxjs';
import { RecognitionEmma, UnderstandingEmma, ShowSpeechStateOptions, ReadingShowOptions, StopReadingOptions, SpeechFeedbackOptions, Cmd } from '../typings/';
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
    protected readonly speech: SpeechIoManager<CmdImpl>;
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
    readonly asrActive: boolean;
    readonly ttsActive: boolean;
    speechOut: SpeechOutputController;
    speechIn: SpeechInputController;
    protected activePageSubscriptions: Array<Subscription>;
    protected dictTargetHandler: DictationTargetHandler;
    protected readTargetHandler: ReadTargetHandler;
    protected dictationOverlay: ISpeechInputIndicator;
    protected readOverlay: ISpeechOutputIndicator;
    protected readOverlayClickSubscription: Subscription;
    debug: boolean;
    protected _speechEventSubscriptions: Map<SpeechEventName, Subscription>;
    protected initializing: Promise<VoiceUIController<CmdImpl>>;
    protected _initialized: boolean;
    readonly initialized: boolean;
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
    protected _asrEngine(engine: string | null): void;
    _ttsEngine(engine: string | null): void;
    protected _enableBargeIn(enable: boolean): void;
    protected doUnsubscribeCurrentPage(): void;
    protected releasePageResources(): void;
    protected releaseUiResources(force: boolean): void;
    handleClick(event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, name: string, data?: any): void;
    localize(res: string): string;
    evalSemantics(asr_result: string): void;
    triggerTouchFeedback(_event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, feedbackOptions?: FeedbackOption): void;
    commandClicked(event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, btnId: string, feedbackOptions?: InputOutputOption): void;
    /**
     *
     * dictationClicked(event: Event, target: DictationTarget, feedbackMode?: SelectionMode)
     *
     * @param  {Event} event
     * @param  {DictationTarget | string} target
     *                          The dication target.
     *                          If called the first time for this target, the argument must be a DictationTarget object
     * @param  {SelectionMode} [feedbackStyle]
     *                          style for visualizing unstable/interim part of dictation result/text
     *                          DEFAULT: uses #_defaultDictationFeedbackStyle
     */
    dictationClicked(event: Event | EventLike, targetId: string | DictationTarget, feedbackStyle?: SelectionMode, touchFeedback?: InputOutputOption): void;
    initDictationTarget(targetId: string | DictationTarget, feedbackStyle?: SelectionMode): DictationHandler;
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
     * @param  {Event} [event]
     * @param  {string | ElementRef | HTMLElement} [target]
     *                          The reading "target"/control widget (if omitted, the target of the event will be used)
     */
    ttsClicked(event?: Event | string | GuiElement | HTMLElement, targetId?: string | GuiElement | HTMLElement, feedbackOptions?: FeedbackOption): void;
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
    protected showSpeechInputState(options: ShowSpeechStateOptions): void;
    /**
     * If <code>options.isStart === true</code>:
     * Called when GUI should show indicator for Microphone input levels.
     *
     * This should also initialize/start listening to mic-levels changes, e.g.
     * register a listener:
     * <pre>
     * mmir.MediaManager.on('miclevelchanged', miclevelsChandeHandler);
     * </pre>
     * where miclevelsChandeHandler:
     *    function(micLevel: number)
     *
     *
     * If <code>options.isStart === false</code>:
     * Called when GUI should hide/deactivate indicator for Microphone input levels.
     *
     * This should destroy/free resource that were set up for visualizing mic-level
     * changes, e.g. could stop listening to mic-level changes, i.e. unregister listener:
     * <pre>
     * mmir.MediaManager.off('miclevelchanged', miclevelsChandeHandler);
     * </pre>
     *
     * @param {SpeechFeedbackOptions} options
     *              the data specifying the (changed) speech input state etc.
     */
    protected changeMicLevels(options: SpeechFeedbackOptions): void;
    protected showReadingStatus(options: ReadingShowOptions): void;
    /**
     * Called when reading should be stopped / aborted.
     *
     * If reading is/was active and is stopped, the "reading-stopped" event must be
     * triggered:
     *
     * <pre>
     * mmir.speechioManager.raise('reading-stopped')
     * </pre>
     *
     * @param  {StopReadingOptions} data the data specifying, which TTS engine should be stopped
     */
    protected stopReading(options: StopReadingOptions): void;
    /**
     * Called when speech input (ASR; recogintion) AND speech output (TTS; synthesis)
     * should be stopped.
     */
    cancelSpeechIO(): void;
}
