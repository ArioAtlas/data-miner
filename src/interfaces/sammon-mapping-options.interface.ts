export interface SammonMappingOptions {
  /** Number of iterations for the gradient descent loop (default: 100) */
  maxIterations?: number;
  /** Learning rate for each gradient descent step (default: 0.01) */
  learningRate?: number;
  /** Target dimensionality for the projection (default: 2) */
  projectionDimension?: number;
  /** Optional random seed if you want reproducible initial positions */
  randomSeed?: number;
  /** Distance function. Defaults to Euclidean. */
  distanceFn?: (a: number[], b: number[]) => number;
}
