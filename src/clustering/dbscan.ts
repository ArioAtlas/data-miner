import { Distance } from '@/base/distance';
import { DBScanOptions } from '@/interfaces/db-scan-options.interface';
import { DBScanResult } from '@/interfaces/db-scan-result.interface';
import { DistanceFunction } from '@/types/distance-function.type';
import { union } from 'lodash';

export class DBSCAN {
  private points: number[][] = [];
  private visited: boolean[] = [];
  private assigned: boolean[] = [];
  private clusters: number[][] = [];

  // Provide default values if user doesn't specify them.
  constructor(private options: DBScanOptions = {}) {
    if (!this.options.epsilon) this.options.epsilon = 0.2;
    if (!this.options.minPoints) this.options.minPoints = 20;
    if (!this.options.distance) this.options.distance = Distance.euclidean;
  }

  public fit(data: number[][]): DBScanResult {
    this.points = data;
    this.visited = Array(data.length).fill(false);
    this.assigned = Array(data.length).fill(false);
    this.clusters = [];

    const { epsilon, minPoints, distance } = this.options;

    // Go through each point in the dataset
    for (let i = 0; i < data.length; i++) {
      // Skip processed points
      if (this.visited[i]) {
        continue;
      }

      this.visited[i] = true;
      // Find initial neighbors
      const neighbors = this.rangeQuery(i, epsilon, distance!);
      // Check core point condition
      if (neighbors.length >= minPoints) {
        this.assigned[i] = true;
        // Expand cluster
        const expandedNeighborhood = this.expandNeighborhood(neighbors, minPoints, epsilon, distance);

        // Start a new cluster
        this.clusters.push([i, ...expandedNeighborhood]);
      }
    }

    return {
      clusters: this.clusters,
      noise: this.points.filter((value, key) => !this.assigned[key]),
    };
  }

  private expandNeighborhood(
    neighbors: number[],
    minPoints: number,
    epsilon: number,
    distance: DistanceFunction,
  ): number[] {
    const cluster: number[] = [];
    for (let i = 0; i < neighbors.length; i++) {
      const point = neighbors[i];

      if (!this.visited[point]) {
        this.visited[point] = true;

        const expandedNeighborhood = this.rangeQuery(point, epsilon, distance);

        // Core-point check
        if (expandedNeighborhood.length >= minPoints) {
          neighbors = union(neighbors, expandedNeighborhood);
        }
      }

      if (!this.assigned[point]) {
        this.assigned[point] = true;
        cluster.push(point);
      }
    }

    return cluster;
  }

  rangeQuery(point: number, epsilon: number, distance: DistanceFunction): number[] {
    const neighbors: number[] = [];

    for (let i = 0; i < this.points.length; i++) {
      if (
        point != i && // Exclude target point (distance will be 0)
        distance(this.points[i], this.points[point]) < epsilon
      ) {
        neighbors.push(i);
      }
    }

    return neighbors;
  }
}
