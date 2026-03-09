interface TextTweenerOptions {
    /** Milliseconds each text is displayed before transitioning. Default: 4000 */
    duration?: number;
    /** Milliseconds for the transition animation. Default: 800 */
    transitionDuration?: number;
    /** Stagger delay between individual letter animations in ms. Default: 15 */
    stagger?: number;
    /** CSS easing string. Default: 'cubic-bezier(0.16, 1, 0.3, 1)' */
    easing?: string;
    /** Direction of cycling. Default: 'forward' */
    direction?: 'forward' | 'backward' | 'alternate';
    /** Whether to loop when reaching the end. Default: true */
    loop?: boolean;
    /** Start playing automatically. Default: true */
    autoplay?: boolean;
    /** CSS class prefix for generated elements. Default: 'tt' */
    classPrefix?: string;
    /** Respect prefers-reduced-motion. Default: true */
    reduceMotion?: boolean;
    /** Case-sensitive letter matching. Default: true */
    caseSensitive?: boolean;
    /** Text alignment within the container. Default: 'left' */
    textAlign?: 'left' | 'center' | 'right';
    /** Texts to animate (alternative to DOM children). */
    texts?: string[];
}
interface CharPosition {
    char: string;
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    element: HTMLSpanElement;
}
interface MatchPair {
    source: CharPosition;
    target: CharPosition;
    distance: number;
}
interface TransitionPlan {
    matched: MatchPair[];
    unmatchedSource: CharPosition[];
    unmatchedTarget: CharPosition[];
}
interface TextTweenerEvents {
    ready: () => void;
    beforeTransition: (from: number, to: number) => void;
    afterTransition: (from: number, to: number) => void;
    change: (currentIndex: number) => void;
    pause: () => void;
    resume: () => void;
    destroy: () => void;
}
type EventName = keyof TextTweenerEvents;

declare class TextTweener {
    private container;
    private options;
    private measurer;
    private matcher;
    private animator;
    private emitter;
    private texts;
    private measurements;
    private currentIndex;
    private timer;
    private resizeObserver;
    private state;
    private alternateForward;
    constructor(target: HTMLElement | string, options?: TextTweenerOptions);
    play(): void;
    pause(): void;
    resume(): void;
    next(): Promise<void>;
    prev(): Promise<void>;
    goTo(index: number): Promise<void>;
    destroy(): void;
    on<K extends EventName>(event: K, handler: TextTweenerEvents[K]): () => void;
    off<K extends EventName>(event: K, handler: TextTweenerEvents[K]): void;
    get current(): number;
    get total(): number;
    get isPlaying(): boolean;
    private init;
    private extractTexts;
    private transitionTo;
    private scheduleNext;
    private getNextIndex;
    private getPrevIndex;
    private clearTimer;
    private setupResizeObserver;
}

export { type CharPosition, type EventName, type MatchPair, TextTweener, type TextTweenerEvents, type TextTweenerOptions, type TransitionPlan };
