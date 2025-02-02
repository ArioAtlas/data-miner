import { Distance } from '@/base/distance';
import { HierarchicalOptions } from '@/interfaces/hierarchical-options.interface';
import { HierarchicalResult } from '@/interfaces/hierarchical-result.interface';
import { agnes } from 'ml-hclust';

/**
 * **Hierarchical Cluster Analysis** or **HCA**
 * - A clustering method that builds a hierarchy of clusters
 * - Use Agglomerative (bottom-up) approach
 */
//TODO: Add support for Divisive (top-down) approach since ml-hclust supports it
export class Hierarchical {
  private options: HierarchicalOptions;

  constructor(options: HierarchicalOptions = {}) {
    this.options = {
      clusters: options.clusters ?? 2,
      linkage: options.linkage ?? 'complete',
      distance: options.distance ?? Distance.euclidean,
    };
  }

  /**
   * Perform hierarchical clustering on the given data
   * @param data An array of points: each point is [x1, x2, ..., xN]
   */
  public fit(data: number[][]): Promise<HierarchicalResult> {
    return new Promise((resolve) => {
      const { clusters, linkage, distance } = this.options;

      // Build the dendrogram using Agglomerative clustering
      const dendrogram = agnes(data, {
        method: linkage,
        distanceFunction: distance,
      });

      // partition is a number[] array assigning each data point to one of k clusters
      const partition = dendrogram.cut(clusters!);

      const clusterMap: Map<number, number[][]> = new Map();
      partition.forEach(({ index }, i) => {
        if (!clusterMap.has(index)) {
          clusterMap.set(index, []);
        }
        clusterMap.get(index)!.push(data[i]);
      });

      // Convert the cluster map into an array of arrays
      const finalClusters = [...clusterMap.values()];

      resolve({
        clusters: finalClusters,
      });
    });
  }
}
