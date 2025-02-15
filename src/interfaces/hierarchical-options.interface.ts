import { AgglomerationMethod } from 'ml-hclust';

export interface HierarchicalOptions {
  /** The number of clusters to form (default 2). */
  clusters?: number;
  /** The linkage criterion to use in the algorithm (default 'complete'). */
  linkage?: AgglomerationMethod;
  /** A function that calculates the distance between two points (default Euclidean). */
  distance?: (a: number[], b: number[]) => number;
}
