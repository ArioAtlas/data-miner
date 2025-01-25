import { LevenshteinDistanceOption } from '@/interfaces/levenshtein-distance-option.interface';

const DEFAULT_DELETION_COST = 1;
const DEFAULT_INSERTION_COST = 1;
const DEFAULT_SUBSTITUTION_COST = 1;

export class Distance {
  public static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Points must have the same dimension');
    }
    let sumSquared = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sumSquared += diff * diff;
    }
    return Math.sqrt(sumSquared);
  }

  public static manhattanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Points must have the same dimension');
    }
    let total = 0;
    for (let i = 0; i < a.length; i++) {
      total += Math.abs(a[i] - b[i]);
    }
    return total;
  }

  /**
   * Computes the Levenshtein distance (edit distance) between two strings.
   * By default, each operation (deletion, insertion, substitution) costs 1.
   */
  public static levenshteinDistance(first: string, second: string, options: LevenshteinDistanceOption = {}): number {
    const deletionCost = options.deletionCost ?? DEFAULT_DELETION_COST;
    const insertionCost = options.insertionCost ?? DEFAULT_INSERTION_COST;
    const substitutionCost = options.substitutionCost ?? DEFAULT_SUBSTITUTION_COST;

    // Cache for memoization
    const cache = new Map<string, number>();

    function lev(i: number, j: number): number {
      if (i <= 0) return j * insertionCost;
      if (j <= 0) return i * deletionCost;

      const key = `${i}:${j}`;
      if (cache.has(key)) {
        return cache.get(key) || 0;
      }

      const costDel = lev(i - 1, j) + deletionCost;
      const costIns = lev(i, j - 1) + insertionCost;
      const costSub = lev(i - 1, j - 1) + (first[i - 1] === second[j - 1] ? 0 : substitutionCost);

      const minCost = Math.min(costDel, costIns, costSub);
      cache.set(key, minCost);
      return minCost;
    }

    return lev(first.length, second.length);
  }
}
