import { describe, it, expect } from 'vitest';
import { charToClassName, normalizeChar, segmentText } from '../src/utils/char';

describe('charToClassName', () => {
  it('maps lowercase letters', () => {
    expect(charToClassName('a')).toBe('a');
    expect(charToClassName('z')).toBe('z');
  });

  it('maps uppercase letters to lowercase', () => {
    expect(charToClassName('A')).toBe('a');
    expect(charToClassName('Z')).toBe('z');
  });

  it('maps digits to word names', () => {
    expect(charToClassName('0')).toBe('zero');
    expect(charToClassName('1')).toBe('one');
    expect(charToClassName('5')).toBe('five');
    expect(charToClassName('9')).toBe('nine');
  });

  it('maps special characters to names', () => {
    expect(charToClassName('!')).toBe('exmark');
    expect(charToClassName('?')).toBe('qmark');
    expect(charToClassName('.')).toBe('dot');
    expect(charToClassName(',')).toBe('comma');
    expect(charToClassName(':')).toBe('colon');
    expect(charToClassName('-')).toBe('minus');
    expect(charToClassName('_')).toBe('uscore');
    expect(charToClassName('@')).toBe('at');
    expect(charToClassName('#')).toBe('hash');
  });

  it('returns null for whitespace', () => {
    expect(charToClassName(' ')).toBeNull();
    expect(charToClassName('\t')).toBeNull();
  });

  it('maps unknown unicode to codepoint', () => {
    const result = charToClassName('ü');
    expect(result).toBe('u' + 'ü'.codePointAt(0)!.toString(16));
  });
});

describe('normalizeChar', () => {
  it('returns char as-is when case-sensitive', () => {
    expect(normalizeChar('A', true)).toBe('A');
    expect(normalizeChar('a', true)).toBe('a');
  });

  it('lowercases when case-insensitive', () => {
    expect(normalizeChar('A', false)).toBe('a');
    expect(normalizeChar('a', false)).toBe('a');
  });
});

describe('segmentText', () => {
  it('segments simple ASCII text', () => {
    expect(segmentText('Hello')).toEqual(['H', 'e', 'l', 'l', 'o']);
  });

  it('segments text with spaces', () => {
    expect(segmentText('A B')).toEqual(['A', ' ', 'B']);
  });

  it('handles empty string', () => {
    expect(segmentText('')).toEqual([]);
  });

  it('handles numbers and special chars', () => {
    expect(segmentText('A1!')).toEqual(['A', '1', '!']);
  });
});
