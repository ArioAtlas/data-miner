import { LevenshteinDistanceOption } from '@/interfaces/levenshtein-distance-option.interface';

export class Distance {
  public static squaredEuclidean(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Points must have the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return sum;
  }

  public static euclidean(a: number[], b: number[]): number {
    return Math.sqrt(Distance.squaredEuclidean(a, b));
  }

  public static manhattan(a: number[], b: number[]): number {
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
  public static levenshtein(first: string, second: string, options: LevenshteinDistanceOption = {}): number {
    const deletionCost = options.deletionCost ?? 1;
    const insertionCost = options.insertionCost ?? 1;
    const substitutionCost = options.substitutionCost ?? 1;

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
