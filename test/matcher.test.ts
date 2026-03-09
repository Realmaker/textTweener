import { describe, it, expect } from 'vitest';
import { Matcher } from '../src/core/Matcher';
import type { CharPosition } from '../src/types';

function makeChar(char: string, index: number, x: number, y: number): CharPosition {
  return {
    char,
    index,
    x,
    y,
    width: 10,
    height: 16,
    element: document.createElement('span'),
  };
}

describe('Matcher', () => {
  const matcher = new Matcher(true);

  it('matches identical single characters', () => {
    const source = [makeChar('A', 0, 0, 0)];
    const target = [makeChar('A', 0, 50, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(1);
    expect(plan.matched[0].source.char).toBe('A');
    expect(plan.matched[0].target.char).toBe('A');
    expect(plan.unmatchedSource).toHaveLength(0);
    expect(plan.unmatchedTarget).toHaveLength(0);
  });

  it('returns all unmatched when no shared characters', () => {
    const source = [makeChar('A', 0, 0, 0), makeChar('B', 1, 10, 0)];
    const target = [makeChar('X', 0, 0, 0), makeChar('Y', 1, 10, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(0);
    expect(plan.unmatchedSource).toHaveLength(2);
    expect(plan.unmatchedTarget).toHaveLength(2);
  });

  it('uses nearest-neighbor matching for duplicate characters', () => {
    // Two "A"s in source at positions 0 and 100
    // Two "A"s in target at positions 90 and 10
    // Nearest: source[0](x=0) → target[1](x=10), source[1](x=100) → target[0](x=90)
    const source = [makeChar('A', 0, 0, 0), makeChar('A', 1, 100, 0)];
    const target = [makeChar('A', 0, 90, 0), makeChar('A', 1, 10, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(2);
    // source index 0 (x=0) should match target index 1 (x=10) — nearest
    const match0 = plan.matched.find(m => m.source.index === 0)!;
    expect(match0.target.x).toBe(10);
    // source index 1 (x=100) should match target index 0 (x=90) — nearest
    const match1 = plan.matched.find(m => m.source.index === 1)!;
    expect(match1.target.x).toBe(90);
  });

  it('handles partial overlap correctly', () => {
    const source = [makeChar('A', 0, 0, 0), makeChar('B', 1, 10, 0), makeChar('C', 2, 20, 0)];
    const target = [makeChar('B', 0, 0, 0), makeChar('D', 1, 10, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(1);
    expect(plan.matched[0].source.char).toBe('B');
    expect(plan.unmatchedSource).toHaveLength(2); // A, C
    expect(plan.unmatchedTarget).toHaveLength(1); // D
  });

  it('skips whitespace characters', () => {
    const source = [makeChar('A', 0, 0, 0), makeChar(' ', 1, 10, 0), makeChar('B', 2, 20, 0)];
    const target = [makeChar('A', 0, 0, 0), makeChar(' ', 1, 10, 0), makeChar('B', 2, 20, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(2); // A and B, not the space
  });

  it('is case-sensitive by default', () => {
    const source = [makeChar('A', 0, 0, 0)];
    const target = [makeChar('a', 0, 50, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(0);
    expect(plan.unmatchedSource).toHaveLength(1);
    expect(plan.unmatchedTarget).toHaveLength(1);
  });

  it('supports case-insensitive matching when configured', () => {
    const insensitiveMatcher = new Matcher(false);
    const source = [makeChar('A', 0, 0, 0)];
    const target = [makeChar('a', 0, 50, 0)];
    const plan = insensitiveMatcher.match(source, target);

    expect(plan.matched).toHaveLength(1);
  });

  it('handles empty source', () => {
    const source: CharPosition[] = [];
    const target = [makeChar('A', 0, 0, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(0);
    expect(plan.unmatchedSource).toHaveLength(0);
    expect(plan.unmatchedTarget).toHaveLength(1);
  });

  it('handles empty target', () => {
    const source = [makeChar('A', 0, 0, 0)];
    const target: CharPosition[] = [];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(0);
    expect(plan.unmatchedSource).toHaveLength(1);
    expect(plan.unmatchedTarget).toHaveLength(0);
  });

  it('sorts matched pairs by source index', () => {
    const source = [makeChar('C', 0, 20, 0), makeChar('A', 1, 0, 0), makeChar('B', 2, 10, 0)];
    const target = [makeChar('A', 0, 0, 0), makeChar('B', 1, 10, 0), makeChar('C', 2, 20, 0)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(3);
    expect(plan.matched[0].source.index).toBe(0);
    expect(plan.matched[1].source.index).toBe(1);
    expect(plan.matched[2].source.index).toBe(2);
  });

  it('considers Y distance for multi-line matching', () => {
    // source "A" at (0, 0), target "A"s at (100, 0) and (5, 50)
    // Euclidean: (100,0)=100, (5,50)=~50.2 → should pick (5, 50)
    const source = [makeChar('A', 0, 0, 0)];
    const target = [makeChar('A', 0, 100, 0), makeChar('A', 1, 5, 50)];
    const plan = matcher.match(source, target);

    expect(plan.matched).toHaveLength(1);
    expect(plan.matched[0].target.x).toBe(5);
    expect(plan.matched[0].target.y).toBe(50);
    expect(plan.unmatchedTarget).toHaveLength(1);
  });
});
