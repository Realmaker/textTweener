import type { CharPosition, ResolvedOptions } from '../types';
import { charToClassName, segmentText } from '../utils/char';
import { createElement } from '../utils/dom';

export interface MeasuredText {
  original: string;
  chars: CharPosition[];
  width: number;
  height: number;
  element: HTMLElement;
}

/**
 * Handles wrapping characters into spans and measuring their positions.
 */
export class Measurer {
  private container: HTMLElement;
  private options: ResolvedOptions;
  private measurements: MeasuredText[] = [];

  constructor(container: HTMLElement, options: ResolvedOptions) {
    this.container = container;
    this.options = options;
  }

  /**
   * Measure all texts and return their character positions.
   * Waits for fonts to be loaded before measuring.
   */
  async measureAll(texts: string[]): Promise<MeasuredText[]> {
    // Wait for fonts to load
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }

    this.measurements = texts.map((text, i) => this.measureText(text, i));
    return this.measurements;
  }

  /**
   * Re-measure all texts (e.g. after resize).
   */
  async remeasure(texts: string[]): Promise<MeasuredText[]> {
    // Clean up old measurement elements
    this.cleanup();
    return this.measureAll(texts);
  }

  /**
   * Get the maximum dimensions across all measured texts.
   */
  getMaxDimensions(): { width: number; height: number } {
    let maxW = 0;
    let maxH = 0;
    for (const m of this.measurements) {
      if (m.width > maxW) maxW = m.width;
      if (m.height > maxH) maxH = m.height;
    }
    return { width: maxW, height: maxH };
  }

  getMeasurements(): MeasuredText[] {
    return this.measurements;
  }

  cleanup(): void {
    for (const m of this.measurements) {
      m.element.remove();
    }
    this.measurements = [];
  }

  private measureText(text: string, textIndex: number): MeasuredText {
    const prefix = this.options.classPrefix;
    const graphemes = segmentText(text);

    // Create text container
    const textEl = createElement('span', {
      class: `${prefix}-text ${prefix}-measuring`,
      'data-text-index': String(textIndex),
    });

    // Apply text alignment
    textEl.style.textAlign = this.options.textAlign;
    textEl.style.display = 'block';

    // Wrap each character
    const charSpans: HTMLSpanElement[] = [];
    for (let i = 0; i < graphemes.length; i++) {
      const char = graphemes[i];
      const isSpace = char.trim() === '';
      const className = charToClassName(char);

      const span = createElement('span', {
        class: isSpace
          ? `${prefix}-char ${prefix}-space`
          : `${prefix}-char`,
        'data-char': char,
        'data-index': String(i),
        ...(className ? { 'data-class': className } : {}),
      }, [isSpace ? '\u00A0' : char]);

      charSpans.push(span);
      textEl.appendChild(span);
    }

    // Append to container for measurement
    this.container.appendChild(textEl);

    // Measure container rect as reference point
    const containerRect = this.container.getBoundingClientRect();

    // Measure each character
    const chars: CharPosition[] = [];
    for (let i = 0; i < charSpans.length; i++) {
      const span = charSpans[i];
      const rect = span.getBoundingClientRect();
      chars.push({
        char: graphemes[i],
        index: i,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        element: span,
      });
    }

    // Measure the total text dimensions
    const textRect = textEl.getBoundingClientRect();

    return {
      original: text,
      chars,
      width: textRect.width,
      height: textRect.height,
      element: textEl,
    };
  }
}
