import type {
  TextTweenerOptions,
  ResolvedOptions,
  TextTweenerEvents,
  EventName,
} from '../types';
import { Measurer, type MeasuredText } from './Measurer';
import { Matcher } from './Matcher';
import { Animator } from './Animator';
import { EventEmitter } from './EventEmitter';
import { injectStyles } from '../utils/dom';
import { debounce } from '../utils/debounce';
import { updateAriaLive } from '../utils/accessibility';
import { getStructuralCSS } from '../styles';

type State = 'idle' | 'playing' | 'paused' | 'transitioning' | 'destroyed';

const DEFAULTS: ResolvedOptions = {
  duration: 4000,
  transitionDuration: 800,
  stagger: 15,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  direction: 'forward',
  loop: true,
  autoplay: true,
  classPrefix: 'tt',
  reduceMotion: true,
  caseSensitive: true,
  textAlign: 'left',
  texts: [],
};

export class TextTweener {
  private container: HTMLElement;
  private options: ResolvedOptions;
  private measurer: Measurer;
  private matcher: Matcher;
  private animator: Animator;
  private emitter = new EventEmitter<TextTweenerEvents>();

  private texts: string[] = [];
  private measurements: MeasuredText[] = [];
  private currentIndex = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private state: State = 'idle';
  private alternateForward = true;

  constructor(target: HTMLElement | string, options?: TextTweenerOptions) {
    // Resolve container
    if (typeof target === 'string') {
      const el = document.querySelector<HTMLElement>(target);
      if (!el) throw new Error(`TextTweener: Element "${target}" not found`);
      this.container = el;
    } else {
      this.container = target;
    }

    // Merge options
    this.options = { ...DEFAULTS, ...options } as ResolvedOptions;

    // Create modules
    this.measurer = new Measurer(this.container, this.options);
    this.matcher = new Matcher(this.options.caseSensitive);
    this.animator = new Animator(this.options);

    // Initialize
    this.init();
  }

  // --- Public API ---

  play(): void {
    if (this.state === 'destroyed') return;
    if (this.state === 'playing' || this.state === 'transitioning') return;

    if (this.state === 'paused') {
      this.animator.resume();
      this.emitter.emit('resume');
    }

    this.state = 'playing';
    this.scheduleNext();
  }

  pause(): void {
    if (this.state === 'destroyed') return;
    if (this.state !== 'playing' && this.state !== 'transitioning') return;

    this.clearTimer();

    if (this.state === 'transitioning') {
      this.animator.pause();
    }

    this.state = 'paused';
    this.emitter.emit('pause');
  }

  resume(): void {
    this.play();
  }

  async next(): Promise<void> {
    if (this.state === 'destroyed') return;
    const nextIdx = this.getNextIndex();
    if (nextIdx === null) return;
    await this.transitionTo(nextIdx);
  }

  async prev(): Promise<void> {
    if (this.state === 'destroyed') return;
    const prevIdx = this.getPrevIndex();
    if (prevIdx === null) return;
    await this.transitionTo(prevIdx);
  }

  async goTo(index: number): Promise<void> {
    if (this.state === 'destroyed') return;
    if (index < 0 || index >= this.texts.length) return;
    if (index === this.currentIndex) return;
    await this.transitionTo(index);
  }

  destroy(): void {
    if (this.state === 'destroyed') return;

    this.clearTimer();
    this.animator.cancel();
    this.resizeObserver?.disconnect();
    this.measurer.cleanup();

    // Restore original content
    this.container.classList.remove(`${this.options.classPrefix}-container`);

    this.state = 'destroyed';
    this.emitter.emit('destroy');
    this.emitter.removeAll();
  }

  // --- Events ---

  on<K extends EventName>(event: K, handler: TextTweenerEvents[K]): () => void {
    return this.emitter.on(event, handler);
  }

  off<K extends EventName>(event: K, handler: TextTweenerEvents[K]): void {
    this.emitter.off(event, handler);
  }

  // --- Getters ---

  get current(): number {
    return this.currentIndex;
  }

  get total(): number {
    return this.texts.length;
  }

  get isPlaying(): boolean {
    return this.state === 'playing' || this.state === 'transitioning';
  }

  // --- Private ---

  private async init(): Promise<void> {
    const prefix = this.options.classPrefix;

    // Inject structural CSS
    injectStyles(getStructuralCSS(prefix), `${prefix}-styles`);

    // Add container class
    this.container.classList.add(`${prefix}-container`);

    // Extract texts from DOM children or options
    this.texts = this.extractTexts();

    if (this.texts.length < 2) {
      console.warn('TextTweener: Need at least 2 texts to animate.');
      return;
    }

    // Clear original DOM children
    this.container.innerHTML = '';

    // Measure all texts
    this.measurements = await this.measurer.measureAll(this.texts);

    // Set container height to max text height (auto-sizing!)
    const { height } = this.measurer.getMaxDimensions();
    this.container.style.minHeight = `${height}px`;

    // Show first text, hide rest
    for (let i = 0; i < this.measurements.length; i++) {
      const m = this.measurements[i];
      if (i === 0) {
        m.element.classList.remove(`${prefix}-measuring`);
        m.element.setAttribute('aria-hidden', 'false');
        m.element.style.visibility = 'visible';
        m.element.style.position = 'absolute';
        m.element.style.top = '0';
        m.element.style.left = '0';
        m.element.style.width = '100%';
        // Position chars at their measured positions
        for (const charPos of m.chars) {
          if (charPos.char.trim() === '') continue;
          charPos.element.style.position = 'absolute';
          charPos.element.style.left = `${charPos.x}px`;
          charPos.element.style.top = `${charPos.y}px`;
        }
      } else {
        m.element.setAttribute('aria-hidden', 'true');
        m.element.style.visibility = 'hidden';
      }
    }

    // Set up aria-live
    updateAriaLive(this.container, this.texts[0], prefix);

    // Set up resize observer
    this.setupResizeObserver();

    // Emit ready
    this.emitter.emit('ready');

    // Autoplay
    if (this.options.autoplay) {
      this.state = 'playing';
      this.scheduleNext();
    }
  }

  private extractTexts(): string[] {
    // Prefer texts from options
    if (this.options.texts && this.options.texts.length > 0) {
      return this.options.texts;
    }

    // Extract from DOM children
    const children = this.container.children;
    const texts: string[] = [];
    for (let i = 0; i < children.length; i++) {
      const text = children[i].textContent?.trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  private async transitionTo(nextIndex: number): Promise<void> {
    if (this.state === 'transitioning') {
      this.animator.cancel();
    }

    this.clearTimer();
    this.state = 'transitioning';

    const fromIndex = this.currentIndex;
    const sourceText = this.measurements[fromIndex];
    const targetText = this.measurements[nextIndex];

    this.emitter.emit('beforeTransition', fromIndex, nextIndex);

    // Match characters
    const plan = this.matcher.match(sourceText.chars, targetText.chars);

    // Animate
    await this.animator.animate(plan, sourceText, targetText, this.container);

    this.currentIndex = nextIndex;
    this.emitter.emit('afterTransition', fromIndex, nextIndex);
    this.emitter.emit('change', nextIndex);

    // Update aria-live
    updateAriaLive(this.container, this.texts[nextIndex], this.options.classPrefix);

    // Continue playing if we were playing
    if (this.state === 'transitioning') {
      this.state = 'playing';
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    this.clearTimer();
    const nextIdx = this.getNextIndex();
    if (nextIdx === null) {
      this.state = 'idle';
      return;
    }

    this.timer = setTimeout(() => {
      this.transitionTo(nextIdx);
    }, this.options.duration);
  }

  private getNextIndex(): number | null {
    const { direction, loop } = this.options;
    const total = this.texts.length;

    if (direction === 'forward') {
      const next = this.currentIndex + 1;
      if (next >= total) return loop ? 0 : null;
      return next;
    }

    if (direction === 'backward') {
      const prev = this.currentIndex - 1;
      if (prev < 0) return loop ? total - 1 : null;
      return prev;
    }

    // alternate
    if (this.alternateForward) {
      if (this.currentIndex + 1 >= total) {
        this.alternateForward = false;
        return this.currentIndex - 1 >= 0 ? this.currentIndex - 1 : null;
      }
      return this.currentIndex + 1;
    } else {
      if (this.currentIndex - 1 < 0) {
        this.alternateForward = true;
        return this.currentIndex + 1 < total ? this.currentIndex + 1 : null;
      }
      return this.currentIndex - 1;
    }
  }

  private getPrevIndex(): number | null {
    const total = this.texts.length;
    const prev = this.currentIndex - 1;
    if (prev < 0) return this.options.loop ? total - 1 : null;
    return prev;
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;

    const handleResize = debounce(async () => {
      if (this.state === 'destroyed') return;

      // Cancel any running animation
      this.animator.cancel();
      this.clearTimer();

      // Re-measure
      this.measurements = await this.measurer.remeasure(this.texts);

      // Update container height
      const { height } = this.measurer.getMaxDimensions();
      this.container.style.minHeight = `${height}px`;

      // Show current text
      const prefix = this.options.classPrefix;
      for (let i = 0; i < this.measurements.length; i++) {
        const m = this.measurements[i];
        if (i === this.currentIndex) {
          m.element.classList.remove(`${prefix}-measuring`);
          m.element.setAttribute('aria-hidden', 'false');
          m.element.style.visibility = 'visible';
          m.element.style.position = 'absolute';
          m.element.style.top = '0';
          m.element.style.left = '0';
          m.element.style.width = '100%';
          for (const charPos of m.chars) {
            if (charPos.char.trim() === '') continue;
            charPos.element.style.position = 'absolute';
            charPos.element.style.left = `${charPos.x}px`;
            charPos.element.style.top = `${charPos.y}px`;
          }
        } else {
          m.element.setAttribute('aria-hidden', 'true');
          m.element.style.visibility = 'hidden';
        }
      }

      // Resume playback
      if (this.state === 'playing' || this.state === 'transitioning') {
        this.state = 'playing';
        this.scheduleNext();
      }
    }, 150);

    this.resizeObserver = new ResizeObserver(handleResize);
    this.resizeObserver.observe(this.container);
  }
}
