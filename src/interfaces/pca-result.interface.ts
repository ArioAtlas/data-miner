export interface PCAResult {
  /** Original data projected onto principal components: shape (nSamples x projectionDimension) */
  projection: number[][];
  /** Eigenvectors, shape (projectionDimension x nFeatures) */
  components: number[][];
  /** Eigenvalues (variance explained by each component) */
  eigenvalues: number[];
  /** Total variance explained by each component as fraction of total variance */
  explainedVariance: number[];
}
