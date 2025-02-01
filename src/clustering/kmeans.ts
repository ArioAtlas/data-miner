import { Distance } from '@/base/distance';
import { KMeansOptions } from '@/interfaces/k-means-options.interface';
import { KMeansResult } from '@/interfaces/k-means-result.interface';

/**
 * **K-Means**
 * - A simple clustering algorithm that partitions data into k clusters.
 */
export class KMeans {
  private data: number[][] = [];
  private centroids: number[][] = [];

  constructor(private options: KMeansOptions = {}) {
    if (!this.options.k) this.options.k = 3;
    if (!this.options.maxIterations) this.options.maxIterations = 100;
    if (!this.options.distance) {
      this.options.distance = Distance.euclideanDistance;
    }
  }

  public fit(data: number[][]): KMeansResult {
    this.data = data;

    const { k, maxIterations, distance } = this.options;

    // Randomly initialize k centroids
    this.centroids = this.initializeCentroids(this.data, k);

    let assignments: number[] = new Array(this.data.length).fill(-1);
    for (let iter = 0; iter < maxIterations!; iter++) {
      // 1. Assign each data point to the closest centroid
      const newAssignments = this.assignClusters(this.data, this.centroids, distance!);

      // 2. If assignments haven't changed, we've converged
      if (KMeans.arraysEqual(assignments, newAssignments)) {
        break;
      }
      assignments = newAssignments;

      // 3. Recompute centroids based on new assignments
      this.centroids = this.computeCentroids(this.data, assignments, k!);
    }

    // Group points into clusters based on final assignments
    const clusters: number[][][] = [];
    for (let i = 0; i < k!; i++) {
      clusters.push([]);
    }
    for (let i = 0; i < this.data.length; i++) {
      clusters[assignments[i]].push(this.data[i]);
    }

    return {
      clusters,
      centroids: this.centroids,
    };
  }

  private initializeCentroids(data: number[][], k: number): number[][] {
    // A simple approach: pick k random distinct points from the dataset
    const centroids: number[][] = [];
    const usedIndices: Set<number> = new Set();
    while (centroids.length < k) {
      const randomIndex = Math.floor(Math.random() * data.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        centroids.push([...data[randomIndex]]);
      }
    }
    return centroids;
  }

  private assignClusters(
    data: number[][],
    centroids: number[][],
    distanceFn: (a: number[], b: number[]) => number,
  ): number[] {
    return data.map((point) => {
      let minDist = Number.MAX_VALUE;
      let clusterIndex = 0;
      for (let i = 0; i < centroids.length; i++) {
        const dist = distanceFn(point, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = i;
        }
      }
      return clusterIndex;
    });
  }

  private computeCentroids(data: number[][], assignments: number[], k: number): number[][] {
    const newCentroids: number[][] = [];
    const clusterCounts: number[] = new Array(k).fill(0);

    // Initialize sums for each centroid
    for (let i = 0; i < k; i++) {
      newCentroids.push(new Array(data[0].length).fill(0));
    }

    // Sum all points belonging to each cluster
    for (let i = 0; i < data.length; i++) {
      const clusterIndex = assignments[i];
      clusterCounts[clusterIndex]++;
      for (let dim = 0; dim < data[0].length; dim++) {
        newCentroids[clusterIndex][dim] += data[i][dim];
      }
    }

    // Divide each dimension sum by total number of points to get the mean
    for (let i = 0; i < k; i++) {
      if (clusterCounts[i] === 0) {
        // If no points, we can skip or reinit randomly. We'll do a simple skip here.
        continue;
      }
      for (let dim = 0; dim < data[0].length; dim++) {
        newCentroids[i][dim] /= clusterCounts[i];
      }
    }

    return newCentroids;
  }

  private static arraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }
}
