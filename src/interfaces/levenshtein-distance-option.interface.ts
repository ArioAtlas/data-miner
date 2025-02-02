export interface LevenshteinDistanceOption {
  /** The cost of deleting a character. */
  deletionCost?: number;
  /** The cost of inserting a character. */
  insertionCost?: number;
  /** The cost of substituting a character. */
  substitutionCost?: number;
}
