import { PageRankOptions } from '@/interfaces/page-rank-options.interface';
import { PageRankResult } from '@/interfaces/page-rank-result.interface';

export class PageRank {
  private beta: number;
  private maxIterations: number;
  private tolerance: number;

  constructor(options: PageRankOptions = {}) {
    this.beta = options.beta ?? 0.85;
    this.maxIterations = options.maxIterations ?? 100;
    this.tolerance = options.tolerance ?? 1e-6;
  }

  /**
   * Runs PageRank on the given adjacency matrix.
   * Adjacency[i][j] = number of edges from node i to node j.
   * @param adjacency A 2D array representing graph edges
   * @returns The final PageRank scores
   */
  public fit(adjacency: number[][]): PageRankResult {
    const n = adjacency.length;
    if (n === 0) {
      return { ranks: [] };
    }

    // Create the base transition probability matrix M
    const M = this.buildTransitionMatrix(adjacency);

    // Incorporate damping factor beta -> A = beta*M + (1-beta)/n
    // We'll do it in-place, then transpose A for row-based iteration
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        M[i][j] = M[i][j] * this.beta + (1 - this.beta) / n;
      }
    }
    const A = this.transpose(M);

    // Initialize rank to 1/n for each node
    let ranks = new Array(n).fill(1 / n);

    // Iterate until maxIterations or until changes are below tolerance
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const oldRanks = [...ranks];

      // For each row in A, do dot(r, row). Then normalize the new ranks
      const newScores = A.map((row) => this.dot(ranks, row));
      ranks = this.normalize(newScores);

      // Check for convergence
      if (this.sumOfDifferences(oldRanks, ranks) < this.tolerance) {
        break;
      }
    }

    return { ranks };
  }

  /**
   * Builds a column-stochastic transition matrix M from adjacency:
   * M[i][j] = Probability of moving from node i to j
   */
  private buildTransitionMatrix(adjacency: number[][]): number[][] {
    const n = adjacency.length;
    const M: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    // For each row i, divide adjacency[i][j] by sum of adjacency[i]
    // so that each row i of M sums to 1 (if i has out-links)
    for (let i = 0; i < n; i++) {
      const row = adjacency[i];
      const rowSum = row.reduce((acc, val) => acc + val, 0);
      if (rowSum === 0) {
        // If no out-links, it's a dangling node; remain 0 here, will handle with damping
        continue;
      }
      for (let j = 0; j < n; j++) {
        M[i][j] = row[j] / rowSum;
      }
    }
    return M;
  }

  /** Transpose of a 2D matrix */
  private transpose(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = matrix[i][j];
      }
    }
    return result;
  }

  /** Dot product of two vectors of equal length */
  private dot(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /** Normalize ranks so that they sum to 1 */
  private normalize(ranks: number[]): number[] {
    const sum = ranks.reduce((acc, val) => acc + val, 0);
    if (sum === 0) {
      // If something degenerated, return uniform
      return ranks.map(() => 1 / ranks.length);
    }
    return ranks.map((val) => val / sum);
  }

  /** Computes the sum of absolute differences between two vectors */
  private sumOfDifferences(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.abs(a[i] - b[i]);
    }
    return sum;
  }
}
