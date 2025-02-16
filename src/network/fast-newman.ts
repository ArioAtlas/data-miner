import { FastNewmanOptions } from '@/interfaces/fast-newman-options.interface';
import { FastNewmanResult } from '@/interfaces/fast-newman-result.interface';
import { MergeCandidate } from '@/interfaces/merge-candidate.interface';
import { CommunityManager } from '@/utils/community-manager';
import { MaxHeap } from '@/utils/max-heap';

// Helper to create a standardized key (for tracking duplicate candidates)
function makeKey(a: number, b: number): string {
  return a < b ? `${a}#${b}` : `${b}#${a}`;
}

export class FastNewman {
  private options: FastNewmanOptions;
  // Keep history of modularity Q and partitions for inspection.
  private history: Array<{ q: number; communities: number[][] }> = [];

  constructor(options: FastNewmanOptions = {}) {
    this.options = { ...options };
  }

  public async fit(adjacencyMatrix: number[][]): Promise<FastNewmanResult> {
    const nodeCount = adjacencyMatrix.length;
    const adjacency: Map<number, number[]> = new Map();
    const degrees: number[] = new Array(nodeCount).fill(0);

    // Build the adjacency map and compute degrees.
    for (let i = 0; i < nodeCount; i++) {
      const neighbors: number[] = [];
      for (let j = 0; j < nodeCount; j++) {
        if (adjacencyMatrix[i][j] !== 0) {
          neighbors.push(j);
          degrees[i]++;
        }
      }
      adjacency.set(i, neighbors);
    }
    // In an undirected graph, each edge is counted twice.
    const totalDegree = degrees.reduce((acc, deg) => acc + deg, 0);
    const edgeCount = totalDegree / 2;

    // Initialize CommunityManager with our computed data.
    const cm = new CommunityManager(nodeCount, degrees, edgeCount);

    // Build a mapping for each community to its neighbor communities.
    // Each entry: communityId -> Map(neighborCommId -> number of connecting edges)
    const commEdges: Map<number, Map<number, number>> = new Map();
    for (let node = 0; node < nodeCount; node++) {
      const neighbors = adjacency.get(node) ?? [];
      for (const neighbor of neighbors) {
        // Process each undirected edge only once.
        if (neighbor <= node) continue;
        const commA = cm.nodeToComm[node];
        const commB = cm.nodeToComm[neighbor];
        if (commA === commB) continue;
        if (!commEdges.has(commA)) commEdges.set(commA, new Map());
        if (!commEdges.has(commB)) commEdges.set(commB, new Map());
        commEdges.get(commA)!.set(commB, (commEdges.get(commA)!.get(commB) ?? 0) + 1);
        commEdges.get(commB)!.set(commA, (commEdges.get(commB)!.get(commA) ?? 0) + 1);
      }
    }

    // Build a max-heap of merge candidates.
    const heap = new MaxHeap<MergeCandidate>();
    const insertedPairs = new Set<string>();
    for (const [comm, neighborMap] of commEdges.entries()) {
      for (const [nbr, edgeCountBetween] of neighborMap.entries()) {
        const key = makeKey(comm, nbr);
        if (insertedPairs.has(key)) continue;
        insertedPairs.add(key);
        const delta = cm.deltaQ(comm, nbr, edgeCountBetween);
        heap.insert({ deltaQ: delta, commA: comm, commB: nbr });
      }
    }

    // Compute initial modularity.
    let currentQ = this.computeInitialModularity(cm);
    this.history.push({ q: currentQ, communities: this.extractCommunities(cm) });

    // Main loop: merge communities while beneficial candidates exist.
    const desired = this.options.numberOfCommunities ?? 1;
    while (heap.size() > 0) {
      // Check if we've reached the desired number of communities.
      if (cm.commDegree.size <= desired) break;

      const candidate = heap.extractMax()!;
      if (candidate.deltaQ <= 0) break;
      // Skip candidates if either community is no longer active.
      if (!cm.commDegree.has(candidate.commA) || !cm.commDegree.has(candidate.commB)) {
        continue;
      }

      // Merge the two communities.
      const mergedId = cm.mergeCommunities(candidate.commA, candidate.commB);
      currentQ += candidate.deltaQ;
      this.history.push({ q: currentQ, communities: this.extractCommunities(cm) });

      // Create a new neighbor map for the merged community.
      const newNeighbors = new Map<number, number>();

      // Helper: update newNeighbors with the neighbor map from a merging community.
      const updateNeighbors = (oldComm: number) => {
        const nbrMap = commEdges.get(oldComm);
        if (!nbrMap) return;
        for (const [nbr, count] of nbrMap.entries()) {
          if (nbr === candidate.commA || nbr === candidate.commB) continue;
          newNeighbors.set(nbr, (newNeighbors.get(nbr) ?? 0) + count);
          // Update the neighbor's map: remove the old community and add the merged one.
          const neighborMap = commEdges.get(nbr);
          if (neighborMap) {
            neighborMap.delete(candidate.commA);
            neighborMap.delete(candidate.commB);
            neighborMap.set(mergedId, (neighborMap.get(mergedId) ?? 0) + count);
          }
        }
      };

      updateNeighbors(candidate.commA);
      updateNeighbors(candidate.commB);

      // Remove the merged communities from the mapping and add the new one.
      commEdges.delete(candidate.commA);
      commEdges.delete(candidate.commB);
      commEdges.set(mergedId, newNeighbors);

      // Insert new merge candidates for the merged community.
      for (const [nbr, edgeCountBetween] of newNeighbors.entries()) {
        const delta = cm.deltaQ(mergedId, nbr, edgeCountBetween);
        heap.insert({ deltaQ: delta, commA: mergedId, commB: nbr });
      }
    }

    // Pick the partition with the best modularity from the history.
    const best = this.history.reduce((acc, cur) => (cur.q > acc.q ? cur : acc));
    return {
      communities: best.communities,
      modularityHistory: this.history,
    };
  }

  /**
   * Compute the initial modularity.
   * Since every node starts in its own community (no intra-community edges),
   * Q = -Σ ( (deg(c) / (2m))^2 ).
   */
  private computeInitialModularity(cm: CommunityManager): number {
    const m = cm.totalEdges;
    let sum = 0;
    cm.commDegree.forEach((deg) => {
      const fraction = deg / (2 * m);
      sum += fraction * fraction;
    });
    return -sum;
  }

  /**
   * Extracts communities from the node-to-community mapping.
   */
  private extractCommunities(cm: CommunityManager): number[][] {
    const communities = new Map<number, number[]>();
    cm.nodeToComm.forEach((comm, node) => {
      if (!communities.has(comm)) communities.set(comm, []);
      communities.get(comm)!.push(node);
    });
    return Array.from(communities.values());
  }
}
