export interface TSNEOptions {
  /** Target dimension for the embedding (default: 2). */
  dimension?: number;
  /** Perplexity used to compute the P distribution (default: 30). */
  perplexity?: number;
  /** Initial step size / learning rate for gradient descent (default: 200) */
  learningRate?: number;
  /** Maximum number of iterations (default: 1000). */
  maxIterations?: number;
  /** Early exaggeration factor (default: 12). */
  earlyExaggeration?: number;
  /** Number of iterations to apply early exaggeration (default: 250). */
  earlyExaggerationIter?: number;
  /** Random seed if desired (for reproducible random init). */
  randomSeed?: number;
  /** Distance function (defaults to Square Euclidean). */
  distanceFn?: (a: number[], b: number[]) => number;
}
