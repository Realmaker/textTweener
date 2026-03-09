const SPECIAL_CHARS: Record<string, string> = {
  '!': 'exmark',
  '?': 'qmark',
  '.': 'dot',
  ',': 'comma',
  ':': 'colon',
  ';': 'semicolon',
  '-': 'minus',
  '_': 'uscore',
  '"': 'dquote',
  "'": 'squote',
  '(': 'lparen',
  ')': 'rparen',
  '[': 'lbracket',
  ']': 'rbracket',
  '{': 'lbrace',
  '}': 'rbrace',
  '/': 'slash',
  '\\': 'bslash',
  '@': 'at',
  '#': 'hash',
  '$': 'dollar',
  '%': 'percent',
  '&': 'amp',
  '*': 'star',
  '+': 'plus',
  '=': 'equals',
  '<': 'lt',
  '>': 'gt',
  '~': 'tilde',
  '^': 'caret',
  '|': 'pipe',
};

const DIGIT_NAMES = [
  'zero', 'one', 'two', 'three', 'four',
  'five', 'six', 'seven', 'eight', 'nine',
];

/**
 * Convert a character to a safe CSS class suffix.
 * Returns null for whitespace (spaces are layout-only, not matched).
 */
export function charToClassName(char: string): string | null {
  if (/^[a-zA-Z]$/.test(char)) {
    return char.toLowerCase();
  }
  if (/^[0-9]$/.test(char)) {
    return DIGIT_NAMES[parseInt(char, 10)];
  }
  if (char in SPECIAL_CHARS) {
    return SPECIAL_CHARS[char];
  }
  if (char.trim() === '') {
    return null;
  }
  // Unicode fallback
  return 'u' + char.codePointAt(0)!.toString(16);
}

/**
 * Normalize a character for matching purposes.
 */
export function normalizeChar(char: string, caseSensitive: boolean): string {
  return caseSensitive ? char : char.toLowerCase();
}

/**
 * Segment a string into grapheme clusters.
 * Uses Intl.Segmenter when available, falls back to Array.from.
 */
export function segmentText(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    // Intl.Segmenter for proper grapheme cluster support
    const segmenter = new (Intl as unknown as { Segmenter: new (locale: string, opts: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}
