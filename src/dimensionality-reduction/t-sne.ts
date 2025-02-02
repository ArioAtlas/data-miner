import { TSNEOptions } from '@/interfaces/tsne-options.interface';
import { TSNEResult } from '@/interfaces/tsne-result.interface';
import { alea } from 'seedrandom';

/**
 * **t‑SNE (t-Distributed Stochastic Neighbor Embedding)**
 * - A dimensionality reduction technique.
 */
export class TSNE {
  private dim: number;
  private perplexity: number;
  private learningRate: number;
  private maxIterations: number;
  private earlyExaggeration: number;
  private earlyExaggerationIter: number;
  private random: () => number;
  private distanceFn: (a: number[], b: number[]) => number;

  constructor(options: TSNEOptions = {}) {
    this.dim = options.dimension ?? 2;
    this.perplexity = options.perplexity ?? 30;
    this.learningRate = options.learningRate ?? 200;
    this.maxIterations = options.maxIterations ?? 1000;
    this.earlyExaggeration = options.earlyExaggeration ?? 12;
    this.earlyExaggerationIter = options.earlyExaggerationIter ?? 250;
    this.distanceFn = options.distanceFn ?? this.squaredEuclideanDistance;

    if (typeof options.randomSeed === 'number') {
      this.random = alea(options.randomSeed.toString());
    } else {
      this.random = Math.random;
    }
  }

  /**
   * Main entry point. Given an NxD dataset, run t‑SNE and return an embedding.
   */
  public fit(data: number[][]): TSNEResult {
    const n = data.length;
    if (n === 0) {
      return { embedding: [] };
    }

    // 1. Compute the pairwise squared distances in high-dimensional space.
    const distances = this.computePairwiseDistances(data);

    // 2. Compute the joint probability matrix P
    const P = this.computePMatrix(distances, this.perplexity);

    // 3. Apply early exaggeration (multiply all entries by the factor – without renormalizing).
    this.applyExaggeration(P, this.earlyExaggeration);

    // 4. Initialize the low-dimensional embedding Y randomly (small values).
    const Y = this.initializeEmbedding(n, this.dim);

    // 5. Prepare for gradient descent: velocity storage and iteration schedule.
    const YVel = Array.from({ length: n }, () => new Array(this.dim).fill(0));
    const totalIter = this.maxIterations;
    const stageOneIters = Math.min(this.earlyExaggerationIter, totalIter);
    const stageTwoIters = totalIter - stageOneIters;
    let iteration = 0;

    // Stage (a): Optimize with early exaggeration.
    for (let i = 0; i < stageOneIters; i++) {
      this.gradientDescentStep(Y, YVel, P, iteration);
      iteration++;
    }

    // Stage (b): Remove early exaggeration (divide by factor) and continue optimizing.
    this.removeExaggeration(P, this.earlyExaggeration);
    for (let i = 0; i < stageTwoIters; i++) {
      this.gradientDescentStep(Y, YVel, P, iteration);
      iteration++;
    }

    return { embedding: Y };
  }

  /**
   * A single gradient descent step on the KL divergence cost.
   * Uses the t‑distribution (with 1 degree of freedom) for the low‑dimensional affinities.
   *
   * The gradient (ignoring constant factors) is:
   *    ∂C/∂yᵢ = 4 ∑ⱼ (P₍ᵢⱼ₎ – Q₍ᵢⱼ₎) (yᵢ – yⱼ)/(1 + ||yᵢ – yⱼ||²)
   */
  private gradientDescentStep(Y: number[][], YVel: number[][], P: number[][], iteration: number) {
    const n = Y.length;
    const momentum = iteration < 250 ? 0.5 : 0.8;

    // Build the low-dimensional affinities Q.
    const Q: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const embeddingDist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    let sumQ = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = this.squaredDist(Y[i], Y[j]);
        embeddingDist[i][j] = dist;
        embeddingDist[j][i] = dist;
        const qVal = 1 / (1 + dist);
        Q[i][j] = qVal;
        Q[j][i] = qVal;
        sumQ += 2 * qVal;
      }
    }
    // Normalize Q so that ∑ᵢⱼ Q₍ᵢⱼ₎ = 1.
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        Q[i][j] /= sumQ;
      }
    }

    // Compute the gradient for each point.
    const grads: number[][] = Array.from({ length: n }, () => new Array(this.dim).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        // Note: The term is (P - Q) divided by (1+||yᵢ-yⱼ||²), then multiplied by (yᵢ-yⱼ)
        const diff = P[i][j] - Q[i][j];
        const factor = (4 * diff) / (1 + embeddingDist[i][j]);
        for (let d = 0; d < this.dim; d++) {
          grads[i][d] += factor * (Y[i][d] - Y[j][d]);
        }
      }
    }

    // Update Y using momentum and the learning rate.
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < this.dim; d++) {
        YVel[i][d] = momentum * YVel[i][d] - this.learningRate * grads[i][d];
        Y[i][d] += YVel[i][d];
      }
    }
  }

  /**
   * Computes the conditional probabilities P₍ⱼ|ᵢ₎ such that
   *    P₍ⱼ|ᵢ₎ ∝ exp(–dᵢⱼ * beta)
   * with beta = 1/(2σ²) and dᵢⱼ being the squared distance.
   * We use a binary search to get the entropy of the conditional distribution close to log(perplexity).
   * Finally, we symmetrize to obtain the joint probabilities:
   *    P₍ᵢⱼ₎ = (P₍ⱼ|ᵢ₎ + P₍ᵢ|ⱼ₎)/(2n)
   */
  private computePMatrix(distances: number[][], perplexity: number): number[][] {
    const n = distances.length;
    const P = Array.from({ length: n }, () => new Array(n).fill(0));
    const logU = Math.log(perplexity);

    for (let i = 0; i < n; i++) {
      let beta = 1; // beta = 1/(2σ²)
      let betaMin = -Infinity;
      let betaMax = Infinity;
      // Exclude self-distance by using Infinity.
      const row = distances[i].map((val, j) => (i === j ? Infinity : val));
      let tries = 0;
      const maxTries = 50;
      let currP: number[] = [];

      while (tries < maxTries) {
        currP = row.map((dist) => Math.exp(-dist * beta));
        const sumP = currP.reduce((acc, v) => acc + v, 0);
        const normalizedP = currP.map((v) => v / sumP);

        let currEntropy = 0;
        for (let j = 0; j < n; j++) {
          if (normalizedP[j] > 1e-12) {
            currEntropy -= normalizedP[j] * Math.log(normalizedP[j]);
          }
        }

        const entropyDiff = currEntropy - logU;
        if (Math.abs(entropyDiff) < 1e-5) {
          break;
        }
        if (entropyDiff > 0) {
          // Entropy too high: distribution too flat -> increase beta (reduce sigma)
          betaMin = beta;
          beta = isFinite(betaMax) ? (beta + betaMax) / 2 : beta * 2;
        } else {
          // Entropy too low: distribution too peaked -> decrease beta (increase sigma)
          betaMax = beta;
          beta = isFinite(betaMin) ? (beta + betaMin) / 2 : beta / 2;
        }
        tries++;
      }
      const sumP = currP.reduce((acc, v) => acc + v, 0);
      for (let j = 0; j < n; j++) {
        // Set conditional probability, with self-probability = 0.
        P[i][j] = i === j ? 0 : currP[j] / sumP;
      }
    }

    // Symmetrize: P₍ᵢⱼ₎ = (P₍ⱼ|ᵢ₎ + P₍ᵢ|ⱼ₎) / (2n)
    const P_sym = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        P_sym[i][j] = (P[i][j] + P[j][i]) / (2 * n);
      }
    }
    return P_sym;
  }

  /**
   * Multiply every entry of P by the exaggeration factor.
   */
  private applyExaggeration(P: number[][], factor: number) {
    const n = P.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        P[i][j] *= factor;
      }
    }
  }

  /**
   * Remove early exaggeration by dividing each entry by the factor.
   */
  private removeExaggeration(P: number[][], factor: number) {
    const n = P.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        P[i][j] /= factor;
      }
    }
  }

  /**
   * Compute an NxN matrix of squared distances between high-dimensional data points.
   */
  private computePairwiseDistances(data: number[][]): number[][] {
    const n = data.length;
    const distMat: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = this.distanceFn(data[i], data[j]);
        distMat[i][j] = d;
        distMat[j][i] = d;
      }
    }
    return distMat;
  }

  /**
   * Default squared Euclidean distance.
   */
  private squaredEuclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return sum;
  }

  /**
   * Initialize the low-dimensional embedding with small random values.
   */
  private initializeEmbedding(n: number, d: number): number[][] {
    const Y: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < d; j++) {
        // Initialize in a very narrow band around 0.
        row.push((this.random() - 0.5) * 1e-3);
      }
      Y.push(row);
    }
    return Y;
  }

  /**
   * Compute squared distance between two low-dimensional points.
   */
  private squaredDist(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return sum;
  }
}
