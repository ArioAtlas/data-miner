export interface KMeansResult {
  /** Each cluster as an array of points */
  clusters: number[][][];
  /** The final centroid for each cluster */
  centroids: number[][];
}
