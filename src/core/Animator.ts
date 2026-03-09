import type { TransitionPlan, ResolvedOptions, CharPosition } from '../types';
import type { MeasuredText } from './Measurer';
import { prefersReducedMotion } from '../utils/accessibility';

/**
 * Executes transition animations using the Web Animations API.
 */
export class Animator {
  private options: ResolvedOptions;
  private activeAnimations: Animation[] = [];
  private aborted = false;

  constructor(options: ResolvedOptions) {
    this.options = options;
  }

  /**
   * Execute a full transition between two measured texts.
   * Returns a promise that resolves when the transition is complete.
   */
  async animate(
    plan: TransitionPlan,
    sourceText: MeasuredText,
    targetText: MeasuredText,
    container: HTMLElement,
  ): Promise<void> {
    this.aborted = false;
    this.activeAnimations = [];

    const useReducedMotion = this.options.reduceMotion && prefersReducedMotion();

    if (useReducedMotion) {
      await this.crossfade(sourceText, targetText);
      return;
    }

    const { transitionDuration, easing, stagger } = this.options;

    // Phase 1: Position source chars absolutely for animation
    this.prepareSourceForAnimation(sourceText, container);

    // Phase 2: Animate matched letters + fade out unmatched source
    const moveAnimations = this.animateMatched(plan, transitionDuration, easing, stagger);
    const fadeOutAnimations = this.fadeOutUnmatched(plan.unmatchedSource, transitionDuration);

    // Phase 3: Prepare target and fade in unmatched target chars in parallel
    // Start fade-in after a short delay (40% into the transition) so it overlaps
    const fadeInDelay = transitionDuration * 0.4;
    this.prepareTargetForFadeIn(targetText, plan);
    const fadeInAnimations = this.fadeInUnmatched(plan.unmatchedTarget, transitionDuration, fadeInDelay);

    this.activeAnimations.push(...moveAnimations, ...fadeOutAnimations, ...fadeInAnimations);

    // Wait for ALL animations (they run in parallel)
    await this.waitForAnimations(this.activeAnimations);

    if (this.aborted) return;

    // Phase 4: Swap — hide source, show target with all chars visible
    this.swapTexts(sourceText, targetText);

    // Cleanup
    this.resetAfterAnimation(sourceText, targetText);
    this.activeAnimations = [];
  }

  /**
   * Cancel all running animations and snap to end state.
   */
  cancel(): void {
    this.aborted = true;
    for (const anim of this.activeAnimations) {
      anim.cancel();
    }
    this.activeAnimations = [];
  }

  /**
   * Pause all running animations.
   */
  pause(): void {
    for (const anim of this.activeAnimations) {
      anim.pause();
    }
  }

  /**
   * Resume paused animations.
   */
  resume(): void {
    for (const anim of this.activeAnimations) {
      anim.play();
    }
  }

  private prepareSourceForAnimation(sourceText: MeasuredText, _container: HTMLElement): void {
    const prefix = this.options.classPrefix;
    sourceText.element.classList.remove(`${prefix}-measuring`);
    sourceText.element.setAttribute('aria-hidden', 'false');
    sourceText.element.style.visibility = 'visible';
    sourceText.element.style.position = 'absolute';
    sourceText.element.style.top = '0';
    sourceText.element.style.left = '0';
    sourceText.element.style.width = '100%';

    // Place each char at its measured position
    for (const charPos of sourceText.chars) {
      if (charPos.char.trim() === '') continue;
      const el = charPos.element;
      el.style.position = 'absolute';
      el.style.left = `${charPos.x}px`;
      el.style.top = `${charPos.y}px`;
      el.style.willChange = 'transform, opacity';
    }
  }

  private animateMatched(
    plan: TransitionPlan,
    duration: number,
    easing: string,
    stagger: number,
  ): Animation[] {
    const animations: Animation[] = [];

    for (let i = 0; i < plan.matched.length; i++) {
      const { source, target } = plan.matched[i];
      const dx = target.x - source.x;
      const dy = target.y - source.y;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue; // No movement needed

      const anim = source.element.animate(
        [
          { transform: 'translate(0, 0)' },
          { transform: `translate(${dx}px, ${dy}px)` },
        ],
        {
          duration,
          easing,
          delay: i * stagger,
          fill: 'forwards',
        },
      );

      animations.push(anim);
    }

    return animations;
  }

  private fadeOutUnmatched(chars: CharPosition[], duration: number): Animation[] {
    const fadeDuration = duration * 0.4;
    return chars.map((c) =>
      c.element.animate(
        [{ opacity: '1' }, { opacity: '0' }],
        { duration: fadeDuration, fill: 'forwards' },
      ),
    );
  }

  private fadeInUnmatched(chars: CharPosition[], duration: number, delay: number = 0): Animation[] {
    const fadeDuration = duration * 0.4;
    return chars.map((c) => {
      c.element.style.opacity = '0';
      return c.element.animate(
        [{ opacity: '0' }, { opacity: '1' }],
        { duration: fadeDuration, delay, fill: 'forwards' },
      );
    });
  }

  /**
   * Make unmatched target chars visible in the DOM (but opacity 0)
   * so they can fade in while source chars are still animating.
   */
  private prepareTargetForFadeIn(targetText: MeasuredText, _plan: TransitionPlan): void {
    const prefix = this.options.classPrefix;
    targetText.element.classList.remove(`${prefix}-measuring`);
    targetText.element.style.visibility = 'visible';
    targetText.element.style.position = 'absolute';
    targetText.element.style.top = '0';
    targetText.element.style.left = '0';
    targetText.element.style.width = '100%';

    // Hide ALL target chars first
    for (const charPos of targetText.chars) {
      if (charPos.char.trim() === '') continue;
      charPos.element.style.position = 'absolute';
      charPos.element.style.left = `${charPos.x}px`;
      charPos.element.style.top = `${charPos.y}px`;
      charPos.element.style.opacity = '0';
    }

    // Matched target chars stay hidden until swap
    // Unmatched target chars will be faded in by fadeInUnmatched
  }

  private swapTexts(sourceText: MeasuredText, targetText: MeasuredText): void {
    const prefix = this.options.classPrefix;

    // Hide source
    sourceText.element.setAttribute('aria-hidden', 'true');
    sourceText.element.style.visibility = 'hidden';

    // Show target
    targetText.element.classList.remove(`${prefix}-measuring`);
    targetText.element.setAttribute('aria-hidden', 'false');
    targetText.element.style.visibility = 'visible';
    targetText.element.style.position = 'absolute';
    targetText.element.style.top = '0';
    targetText.element.style.left = '0';
    targetText.element.style.width = '100%';

    // Position target chars at their measured positions
    for (const charPos of targetText.chars) {
      if (charPos.char.trim() === '') continue;
      const el = charPos.element;
      el.style.position = 'absolute';
      el.style.left = `${charPos.x}px`;
      el.style.top = `${charPos.y}px`;
    }
  }

  private resetAfterAnimation(sourceText: MeasuredText, targetText: MeasuredText): void {
    // Reset source char styles
    for (const charPos of sourceText.chars) {
      const el = charPos.element;
      el.style.willChange = '';
      el.style.opacity = '';
      el.style.transform = '';
      el.getAnimations().forEach((a) => a.cancel());
    }

    // Reset target char styles (ensure visible)
    for (const charPos of targetText.chars) {
      const el = charPos.element;
      el.style.opacity = '1';
      el.getAnimations().forEach((a) => a.cancel());
    }
  }

  private async crossfade(sourceText: MeasuredText, targetText: MeasuredText): Promise<void> {
    const prefix = this.options.classPrefix;

    // Show target behind source first
    targetText.element.classList.remove(`${prefix}-measuring`);
    targetText.element.style.visibility = 'visible';
    targetText.element.style.position = 'absolute';
    targetText.element.style.top = '0';
    targetText.element.style.left = '0';
    targetText.element.style.width = '100%';
    targetText.element.style.opacity = '0';

    sourceText.element.style.visibility = 'visible';
    sourceText.element.style.position = 'absolute';
    sourceText.element.style.top = '0';
    sourceText.element.style.left = '0';
    sourceText.element.style.width = '100%';
    sourceText.element.classList.remove(`${prefix}-measuring`);

    // Cross-fade
    const fadeOut = sourceText.element.animate(
      [{ opacity: '1' }, { opacity: '0' }],
      { duration: 300, fill: 'forwards' },
    );
    const fadeIn = targetText.element.animate(
      [{ opacity: '0' }, { opacity: '1' }],
      { duration: 300, fill: 'forwards' },
    );

    this.activeAnimations.push(fadeOut, fadeIn);
    await this.waitForAnimations([fadeOut, fadeIn]);

    sourceText.element.setAttribute('aria-hidden', 'true');
    sourceText.element.style.visibility = 'hidden';
    sourceText.element.style.opacity = '';
    targetText.element.setAttribute('aria-hidden', 'false');
    targetText.element.style.opacity = '';

    fadeOut.cancel();
    fadeIn.cancel();
  }

  private async waitForAnimations(animations: Animation[]): Promise<void> {
    const promises = animations.map(
      (a) => a.finished.catch(() => {}), // Ignore cancel errors
    );
    await Promise.all(promises);
  }
}
