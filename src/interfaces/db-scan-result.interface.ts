export interface DBScanResult {
  /** The clusters found by the algorithm. */
  clusters: number[][];
  /** The points that were not assigned to any cluster. */
  noise: number[][];
}
