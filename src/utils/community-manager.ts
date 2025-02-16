/**
 * A specialized data structure to track communities.
 * Keeps track of each node's community and the size (or sum of degrees)
 * in that community. We'll also store the internal plus crossing edges so
 * we can re-calc deltaQ quickly.
 */
export class CommunityManager {
  /** For each node, store which community it currently belongs to */
  public nodeToComm: number[];
  /** For each community, the total degree (sum of degrees of its nodes) */
  public commDegree: Map<number, number>;
  /** The number of edges in the network */
  public totalEdges: number;
  /** The next community ID for merges */
  private nextCommId: number;

  constructor(nodeCount: number, degrees: number[], totalEdges: number) {
    // Initially each node is in its own community
    this.nodeToComm = Array.from({ length: nodeCount }, (_, i) => i);
    this.commDegree = new Map();
    this.totalEdges = totalEdges;
    this.nextCommId = nodeCount; // We'll use new IDs when merging

    // Initialize degrees for each community = node's degree
    for (let i = 0; i < nodeCount; i++) {
      this.commDegree.set(i, degrees[i]);
    }
  }

  /**
   * Merge community B into community A. Return the new community's ID.
   * We'll represent the merged community with a new ID (nextCommId++).
   */
  public mergeCommunities(commA: number, commB: number): number {
    const degA = this.commDegree.get(commA) ?? 0;
    const degB = this.commDegree.get(commB) ?? 0;

    // The new community ID
    const mergedId = this.nextCommId++;
    const newDegree = degA + degB;
    this.commDegree.set(mergedId, newDegree);

    // Remove old communities from the map
    this.commDegree.delete(commA);
    this.commDegree.delete(commB);

    // Update node -> community for all members of A and B
    for (let i = 0; i < this.nodeToComm.length; i++) {
      if (this.nodeToComm[i] === commA || this.nodeToComm[i] === commB) {
        this.nodeToComm[i] = mergedId;
      }
    }
    return mergedId;
  }

  /**
   * Compute the modularity gain, ΔQ, if we merged communities commA and commB.
   * Modularity formula (for undirected) typically:
   * ΔQ = [ (sum_of_edges_between(A,B) / M ) - (degree(A)*degree(B) / (2M^2)) * 2 ]
   * but we'll do a simpler approach: ΔQ = e(A,B)/M - (deg(A)*deg(B))/(2M^2) * 2
   * We rely on external help to figure out e(A,B) = number of edges crossing A and B.
   */
  public deltaQ(commA: number, commB: number, edgesBetween: number): number {
    const m = this.totalEdges;
    const degA = this.commDegree.get(commA) ?? 0;
    const degB = this.commDegree.get(commB) ?? 0;

    // edgesBetween is the number of edges connecting any node in A to any node in B
    // We have to convert that count to fraction of all edges => edgesBetween / m
    const eAB = edgesBetween / m;

    // (degA * degB) / (2m^2) is the expected fraction of edges
    // We'll multiply that by 2 for an undirected network (some definitions do or don't).
    const expAB = (degA * degB) / (2 * m * m);

    return eAB - expAB;
  }
}
