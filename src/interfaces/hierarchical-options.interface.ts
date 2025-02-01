import { AgglomerationMethod } from 'ml-hclust';

export interface HierarchicalOptions {
  clusters?: number;
  linkage?: AgglomerationMethod;
  distance?: (a: number[], b: number[]) => number;
}
