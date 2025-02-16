/**
 * We store merges in a max-heap. Each MergeCandidate is a potential merge
 * of two communities with a deltaQ representing the gain in modularity.
 */
export interface MergeCandidate {
  deltaQ: number;
  commA: number;
  commB: number;
}
