import { Distance } from '@/base/distance';
import { SammonMappingOptions } from '@/interfaces/sammon-mapping-options.interface';
import { SammonMappingResult } from '@/interfaces/sammon-mapping-result.interface';
import { alea } from 'seedrandom';

export class SammonMapping {
  private maxIterations: number;
  private learningRate: number;
  private projectionDimension: number;
  private distanceFn: (a: number[], b: number[]) => number;
  private random: () => number;

  constructor(options: SammonMappingOptions = {}) {
    this.maxIterations = options.maxIterations ?? 20;
    this.learningRate = options.learningRate ?? 0.3;
    this.projectionDimension = options.projectionDimension ?? 2;
    this.distanceFn = options.distanceFn ?? Distance.euclidean;

    if (typeof options.randomSeed === 'number') {
      this.random = alea(options.randomSeed.toString());
    } else {
      this.random = Math.random;
    }
  }

  /**
   * Runs Sammon mapping on the given dataset.
   * @param data An NxD array (N points, each of D dimensions).
   * @returns A SammonMappingResult containing the low-dimensional projection.
   */
  public fit(data: number[][]): SammonMappingResult {
    const n = data.length;
    if (n === 0) {
      return { projection: [] };
    }

    // Step 1: Compute original distance matrix Dist*
    const distStar = this.createDistanceMatrix(data);

    // Step 2: Compute the constant: sum of all distances in distStar
    const C = this.sumOfDistances(distStar);

    // Step 3: Initialize random projection in lower dimension
    let projected = this.initializeProjection(n, this.projectionDimension);

    // Gradient descent
    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Compute distances in projected space
      const distProj = this.createDistanceMatrix(projected);

      // Build a new set of coordinates for the next iteration
      const nextProjection: number[][] = Array.from({ length: n }, () => new Array(this.projectionDimension).fill(0));

      // For each point p in the dataset
      for (let p = 0; p < n; p++) {
        // For each dimension q
        for (let q = 0; q < this.projectionDimension; q++) {
          // First derivative
          const numerator = this.firstDerivative(projected, distProj, distStar, p, q, C);
          // Second derivative
          const denominator = this.secondDerivative(projected, distProj, distStar, p, q, C);

          // Sammon’s update rule
          // newCoord = oldCoord - (learningRate * numerator / |denominator|)
          // (We add a small offset to avoid divide-by-zero if denominator is 0.)
          const oldCoord = projected[p][q];
          const step = this.learningRate * (numerator / (Math.abs(denominator) + 1e-12));
          nextProjection[p][q] = oldCoord - step;
        }
      }

      // Use the newly computed coordinates for the next iteration
      projected = nextProjection;
    }

    return { projection: projected };
  }

  /**
   * Computes the first derivative for Sammon's cost function
   */
  private firstDerivative(
    projected: number[][],
    distProj: number[][],
    distStar: number[][],
    p: number,
    q: number,
    C: number,
  ): number {
    let sum = 0;
    const n = projected.length;
    for (let j = 0; j < n; j++) {
      if (j === p) continue;

      const dStar = distStar[p][j];
      const dProj = distProj[p][j];
      // Ignore pairs with zero original distance or zero projected distance
      if (dStar === 0 || dProj === 0) continue;

      // Numerator = (distStar - distProj)/(distStar * distProj)
      const term1 = (dStar - dProj) / (dStar * dProj);
      // The partial derivative dimension difference
      const term2 = projected[p][q] - projected[j][q];

      sum += term1 * term2;
    }
    // Multiply by factor (-2/C)
    return (-2 / C) * sum;
  }

  /**
   * Computes the second derivative for Sammon's cost function
   */
  private secondDerivative(
    projected: number[][],
    distProj: number[][],
    distStar: number[][],
    p: number,
    q: number,
    C: number,
  ): number {
    let sum = 0;
    const n = projected.length;
    for (let j = 0; j < n; j++) {
      if (j === p) continue;

      const dStar = distStar[p][j];
      const dProj = distProj[p][j];
      if (dStar === 0 || dProj === 0) continue;

      // (1/(distStar*distProj)) * ( (distStar - distProj) - ... )
      const base = 1 / (dStar * dProj);
      const diff = dStar - dProj;

      // The partial derivative dimension difference
      const coordDiff = projected[p][q] - projected[j][q];
      // c = ( (coordDiff^2)/distProj )
      const c = (coordDiff * coordDiff) / dProj;
      // d = 1 + ( (distStar - distProj)/distProj )
      const d = 1 + diff / dProj;

      sum += base * (diff - c * d);
    }
    return (-2 / C) * sum;
  }

  /**
   * Creates an NxN distance matrix for a given NxD dataset.
   */
  private createDistanceMatrix(data: number[][]): number[][] {
    const n = data.length;
    const distances = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = this.distanceFn(data[i], data[j]);
        distances[i][j] = d;
        distances[j][i] = d;
      }
    }
    return distances;
  }

  /**
   * Returns the sum of all (i<j) distances in a matrix.
   */
  private sumOfDistances(matrix: number[][]): number {
    let sum = 0;
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sum += matrix[i][j];
      }
    }
    return sum;
  }

  /**
   * Creates an NxD array of random initial points
   */
  private initializeProjection(n: number, d: number): number[][] {
    const projection: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < d; j++) {
        row.push(this.random());
      }
      projection.push(row);
    }
    return projection;
  }
}
