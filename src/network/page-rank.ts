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

    // Build the transition probability matrix M
    const M = this.buildTransitionMatrix(adjacency);

    // Apply damping factor: A = beta * M + (1-beta)/n
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        M[i][j] = M[i][j] * this.beta + (1 - this.beta) / n;
      }
    }
    const A = this.transpose(M);

    // Initialize rank vector uniformly
    let ranks = new Array(n).fill(1 / n);

    // Iterate until convergence or maxIterations
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const oldRanks = [...ranks];
      const newScores = A.map((row) => this.dot(ranks, row));
      ranks = this.normalize(newScores);

      if (this.sumOfDifferences(oldRanks, ranks) < this.tolerance) {
        break;
      }
    }

    return { ranks };
  }

  /**
   * Builds a column-stochastic transition matrix M from the adjacency matrix.
   * M[i][j] = Probability of moving from node i to j
   * Handles dangling nodes by assigning a uniform probability across all nodes.
   */
  private buildTransitionMatrix(adjacency: number[][]): number[][] {
    const n = adjacency.length;
    const M: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      const row = adjacency[i];
      const rowSum = row.reduce((acc, val) => acc + val, 0);

      if (rowSum === 0) {
        // Dangling node: assign uniform probabilities.
        for (let j = 0; j < n; j++) {
          M[i][j] = 1 / n;
        }
      } else {
        for (let j = 0; j < n; j++) {
          M[i][j] = row[j] / rowSum;
        }
      }
    }
    return M;
  }

  /** Returns the transpose of a 2D matrix */
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

  /** Computes the dot product of two vectors */
  private dot(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /** Normalizes a vector so that its elements sum to 1 */
  private normalize(ranks: number[]): number[] {
    const sum = ranks.reduce((acc, val) => acc + val, 0);
    if (sum === 0) {
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
