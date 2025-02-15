export interface KMeansOptions {
  /** Number of clusters to partition the data into (default: 3) */
  k?: number;
  /** Maximum number of iterations to run the algorithm (default: 100) */
  maxIterations?: number;
  /** Distance function to use for clustering (default: Euclidean) */
  distance?: (a: number[], b: number[]) => number;
}
