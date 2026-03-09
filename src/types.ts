export interface TextTweenerOptions {
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

export type ResolvedOptions = Required<TextTweenerOptions>;

export interface CharPosition {
  char: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  element: HTMLSpanElement;
}

export interface MatchPair {
  source: CharPosition;
  target: CharPosition;
  distance: number;
}

export interface TransitionPlan {
  matched: MatchPair[];
  unmatchedSource: CharPosition[];
  unmatchedTarget: CharPosition[];
}

export interface TextTweenerEvents {
  ready: () => void;
  beforeTransition: (from: number, to: number) => void;
  afterTransition: (from: number, to: number) => void;
  change: (currentIndex: number) => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
}

export type EventName = keyof TextTweenerEvents;
