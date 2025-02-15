export interface DBScanOptions {
  /** specifies how close points should be to each other to be considered a part of a cluster (default 0.2). */
  epsilon?: number;
  /** the minimum number of points to form a cluster. (default 20). */
  minPoints?: number;
  /** a function that calculates the distance between two points (default Euclidean distance). */
  distance?: (a: number[], b: number[]) => number;
}
