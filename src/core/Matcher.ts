import type { CharPosition, MatchPair, TransitionPlan } from '../types';
import { normalizeChar } from '../utils/char';

/**
 * Matches characters between source and target texts using nearest-neighbor.
 *
 * Algorithm:
 * 1. Group characters by their normalized identity
 * 2. For each shared character, compute distance between all source/target pairs
 * 3. Greedily assign closest pairs first
 */
export class Matcher {
  private caseSensitive: boolean;

  constructor(caseSensitive: boolean = false) {
    this.caseSensitive = caseSensitive;
  }

  /**
   * Create a transition plan from source chars to target chars.
   */
  match(source: CharPosition[], target: CharPosition[]): TransitionPlan {
    // Filter out whitespace (spaces are not animated)
    const sourceChars = source.filter((c) => c.char.trim() !== '');
    const targetChars = target.filter((c) => c.char.trim() !== '');

    // Group by normalized character
    const sourceGroups = this.groupByChar(sourceChars);
    const targetGroups = this.groupByChar(targetChars);

    const matched: MatchPair[] = [];
    const assignedSource = new Set<number>();
    const assignedTarget = new Set<number>();

    // Find all shared characters
    for (const [char, sources] of sourceGroups) {
      const targets = targetGroups.get(char);
      if (!targets) continue;

      // Build distance pairs for this character group
      const pairs: { si: number; ti: number; dist: number; source: CharPosition; target: CharPosition }[] = [];

      for (const s of sources) {
        for (const t of targets) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          pairs.push({
            si: s.index,
            ti: t.index,
            dist: Math.sqrt(dx * dx + dy * dy),
            source: s,
            target: t,
          });
        }
      }

      // Sort by distance (closest first)
      pairs.sort((a, b) => a.dist - b.dist);

      // Greedy assignment
      for (const pair of pairs) {
        if (assignedSource.has(pair.si) || assignedTarget.has(pair.ti)) continue;
        assignedSource.add(pair.si);
        assignedTarget.add(pair.ti);
        matched.push({
          source: pair.source,
          target: pair.target,
          distance: pair.dist,
        });
      }
    }

    // Sort matched by source index for stagger ordering
    matched.sort((a, b) => a.source.index - b.source.index);

    const unmatchedSource = sourceChars.filter((c) => !assignedSource.has(c.index));
    const unmatchedTarget = targetChars.filter((c) => !assignedTarget.has(c.index));

    return { matched, unmatchedSource, unmatchedTarget };
  }

  private groupByChar(chars: CharPosition[]): Map<string, CharPosition[]> {
    const groups = new Map<string, CharPosition[]>();
    for (const c of chars) {
      const key = normalizeChar(c.char, this.caseSensitive);
      const group = groups.get(key);
      if (group) {
        group.push(c);
      } else {
        groups.set(key, [c]);
      }
    }
    return groups;
  }
}
