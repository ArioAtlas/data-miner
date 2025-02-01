export interface PCAOptions {
  /** How many principal components to keep (default: 2) */
  projectionDimension?: number;
  /** Whether to center the data by subtracting mean (default: true) */
  center?: boolean;
  /** Whether to scale data to unit variance after centering (default: false) */
  scale?: boolean;
}
