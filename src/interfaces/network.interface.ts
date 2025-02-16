/**
 * A graph 'Network' interface describing the adjacency list of each node.
 * This should match the structure you actually use in your project.
 */
export interface Network {
  // Total number of nodes in the network
  nodeCount: number;
  // Total number of edges in the network
  edgeCount: number;
  // Map: node -> list of adjacent nodes
  adjacency: Map<number, number[]>;
}
