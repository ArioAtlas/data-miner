export interface PageRankOptions {
  /** Damping factor. Default: 0.85 */
  beta?: number;
  /** Maximum number of iterations. Default: 100 */
  maxIterations?: number;
  /** Convergence threshold. Default: 1e-6 */
  tolerance?: number;
}
