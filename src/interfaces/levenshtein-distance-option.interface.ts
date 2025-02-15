export interface LevenshteinDistanceOption {
  /** The cost of deleting a character (default 1). */
  deletionCost?: number;
  /** The cost of inserting a character (default 1). */
  insertionCost?: number;
  /** The cost of substituting a character (default 1). */
  substitutionCost?: number;
}
