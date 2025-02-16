export interface FastNewmanResult {
  communities: number[][];
  modularityHistory: Array<{
    q: number;
    communities: number[][];
  }>;
}
