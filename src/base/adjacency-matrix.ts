import { readFile } from 'fs/promises';

export class AdjacencyMatrix {
  private matrix: number[][];
  private nodeMapping: Array<string | number>;

  private constructor(matrix: number[][], nodeMapping: Array<string | number>) {
    this.matrix = matrix;
    this.nodeMapping = nodeMapping;
  }

  /**
   * Returns the generated adjacency matrix.
   */
  public getMatrix(): number[][] {
    return this.matrix;
  }

  /**
   * Returns a legend mapping matrix indices to original node values.
   */
  public getLegend(): Record<number, string | number> {
    const legend: Record<number, string | number> = {};
    this.nodeMapping.forEach((node, index) => {
      legend[index] = node;
    });
    return legend;
  }

  /**
   * Returns the node value at a given index.
   */
  public getNodeName(index: number): string | number {
    return this.nodeMapping[index];
  }

  /**
   * Creates an AdjacencyMatrix from an array of edges.
   * Each edge is a tuple [source, target]. Nodes can be numbers or strings.
   */
  public static fromEdgeList(edgeList: Array<[string | number, string | number]>): AdjacencyMatrix {
    // Collect unique nodes from the edge list.
    const nodeSet = new Set<string | number>();
    for (const [source, target] of edgeList) {
      nodeSet.add(source);
      nodeSet.add(target);
    }

    // Define an order for the nodes.
    const nodes = Array.from(nodeSet);
    // Create a mapping from node value to index.
    const mapping = new Map<string | number, number>();
    nodes.forEach((node, index) => mapping.set(node, index));

    // Initialize an n x n matrix filled with zeros.
    const n = nodes.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    // Fill in the matrix. Here we mark an edge with 1.
    for (const [source, target] of edgeList) {
      const i = mapping.get(source);
      const j = mapping.get(target);
      if (i !== undefined && j !== undefined) {
        matrix[i][j] = 1;
      }
    }

    return new AdjacencyMatrix(matrix, nodes);
  }

  /**
   * Reads an edge list file and creates an AdjacencyMatrix.
   * Each line of the file should contain two tokens separated by whitespace.
   */
  public static async fromEdgeListFile(path: string): Promise<AdjacencyMatrix> {
    const content = await readFile(path, 'utf8');
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const edges: Array<[string | number, string | number]> = lines.map((line) => {
      const parts = line.split(/\s+/);
      // If the token can be parsed as a number, use it as a number; otherwise keep it as a string.
      const source = isNaN(Number(parts[0])) ? parts[0] : Number(parts[0]);
      const target = isNaN(Number(parts[1])) ? parts[1] : Number(parts[1]);
      return [source, target];
    });

    return AdjacencyMatrix.fromEdgeList(edges);
  }
}
