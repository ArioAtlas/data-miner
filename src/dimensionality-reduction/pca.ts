import { Matrix, EigenvalueDecomposition } from 'ml-matrix';
import { PCAOptions } from '@/interfaces/pca-options.interface';
import { PCAResult } from '@/interfaces/pca-result.interface';

/**
 * **Principal Component Analysis (PCA)**
 * - A dimensionality reduction technique
 */
export class PCA {
  private projectionDimension: number;
  private centerData: boolean;
  private scaleData: boolean;

  private means: number[] = [];
  private stDevs: number[] = [];
  private components: number[][] = [];
  private eigenvalues: number[] = [];
  private explainedVariance: number[] = [];

  constructor(options: PCAOptions = {}) {
    this.projectionDimension = options.projectionDimension ?? 2;
    this.centerData = options.center ?? true;
    this.scaleData = options.scale ?? false;
  }

  /**
   * Runs PCA on the given dataset and returns the projection.
   * @param data An array of samples, each sample is a feature vector: (nSamples x nFeatures)
   */
  public fit(data: number[][]): PCAResult {
    if (data.length === 0) {
      return {
        projection: [],
        components: [],
        eigenvalues: [],
        explainedVariance: [],
      };
    }

    const nFeatures = data[0].length;
    // Preserve the original raw data for the final transform
    const rawData = data.map((row) => [...row]);

    // Work on a copy for centering/scaling before covariance computation
    let transformedData = data.map((row) => [...row]);

    // 1. (Optional) Center data
    if (this.centerData) {
      this.means = this.computeMeans(transformedData);
      transformedData = transformedData.map((row) => row.map((val, i) => val - this.means[i]));
    } else {
      this.means = new Array(nFeatures).fill(0);
    }

    // 2. (Optional) Scale data to unit variance
    if (this.scaleData) {
      this.stDevs = this.computeStDevs(transformedData);
      transformedData = transformedData.map((row) =>
        row.map((val, i) => {
          const sd = this.stDevs[i];
          return sd === 0 ? 0 : val / sd;
        }),
      );
    } else {
      this.stDevs = new Array(nFeatures).fill(1);
    }

    // 3. Compute Covariance Matrix: shape (nFeatures x nFeatures)
    const covarianceMatrix = this.computeCovariance(transformedData);

    // 4. Eigen Decomposition on the covariance matrix
    const covMat = new Matrix(covarianceMatrix);
    const eig = new EigenvalueDecomposition(covMat, { assumeSymmetric: true });

    // eigenValues is an array of real eigenvalues
    const eigenValuesArr: number[] = eig.realEigenvalues;
    // eigenVectors is a matrix (nFeatures x nFeatures) in columns
    const eigenVectorsMat: number[][] = eig.eigenvectorMatrix.to2DArray();

    // 5. Sort eigenvalues and eigenvectors in descending order
    const sorted = this.sortEigenPairs(eigenValuesArr, eigenVectorsMat);
    const sortedEigenValues = sorted.eigenValues;
    const sortedEigenVectors = sorted.eigenVectors;

    // 6. Select top k principal components
    const k = Math.min(this.projectionDimension, nFeatures);
    this.eigenvalues = sortedEigenValues.slice(0, k);
    this.components = [];
    for (let j = 0; j < k; j++) {
      const column = [];
      for (let i = 0; i < nFeatures; i++) {
        column.push(sortedEigenVectors[i][j]);
      }
      this.components.push(column);
    }

    // 7. Compute fraction of variance explained
    const totalVar = sortedEigenValues.reduce((acc, val) => acc + val, 0);
    this.explainedVariance = this.eigenvalues.map((val) => val / totalVar);

    // 8. Project original data onto these k components using transform()
    const projection = this.transform(rawData);

    return {
      projection,
      components: this.components,
      eigenvalues: this.eigenvalues,
      explainedVariance: this.explainedVariance,
    };
  }

  /**
   * After calling fit(), if you want to project new data using the same PCA
   * transformation (means, stDevs, components), call transform() directly.
   */
  public transform(data: number[][]): number[][] {
    if (data.length === 0) return [];

    // Center and scale using saved means & stDevs
    const centeredScaled = data.map((row) => row.map((val, i) => (val - this.means[i]) / (this.stDevs[i] || 1)));

    // For each row, project onto each component
    return centeredScaled.map((row) => {
      const coords: number[] = [];
      for (let pcIndex = 0; pcIndex < this.components.length; pcIndex++) {
        const comp = this.components[pcIndex];
        let dot = 0;
        for (let i = 0; i < row.length; i++) {
          dot += row[i] * comp[i];
        }
        coords.push(dot);
      }
      return coords;
    });
  }

  private computeMeans(data: number[][]): number[] {
    const nSamples = data.length;
    const nFeatures = data[0].length;
    const means = new Array(nFeatures).fill(0);
    for (let i = 0; i < nSamples; i++) {
      for (let j = 0; j < nFeatures; j++) {
        means[j] += data[i][j];
      }
    }
    for (let j = 0; j < nFeatures; j++) {
      means[j] /= nSamples;
    }
    return means;
  }

  private computeStDevs(data: number[][]): number[] {
    const nSamples = data.length;
    const nFeatures = data[0].length;
    const stDevs = new Array(nFeatures).fill(0);
    for (let i = 0; i < nSamples; i++) {
      for (let j = 0; j < nFeatures; j++) {
        stDevs[j] += data[i][j] ** 2;
      }
    }
    for (let j = 0; j < nFeatures; j++) {
      stDevs[j] = Math.sqrt(stDevs[j] / (nSamples - 1));
    }
    return stDevs;
  }

  private computeCovariance(data: number[][]): number[][] {
    const nSamples = data.length;
    const nFeatures = data[0].length;
    const cov: number[][] = Array.from({ length: nFeatures }, () => new Array(nFeatures).fill(0));
    for (let s = 0; s < nSamples; s++) {
      for (let i = 0; i < nFeatures; i++) {
        for (let j = 0; j < nFeatures; j++) {
          cov[i][j] += data[s][i] * data[s][j];
        }
      }
    }
    for (let i = 0; i < nFeatures; i++) {
      for (let j = 0; j < nFeatures; j++) {
        cov[i][j] /= nSamples - 1;
      }
    }
    return cov;
  }

  /**
   * Sort eigenpairs (values, vectors) in descending order of eigenvalues
   */
  private sortEigenPairs(eigenValues: number[], eigenVectors: number[][]) {
    const pairs = eigenValues.map((val, i) => ({ val, idx: i }));
    pairs.sort((a, b) => b.val - a.val);

    const sortedValues = pairs.map((p) => p.val);
    const sortedVectors = new Array(eigenVectors.length).fill(null).map(() => new Array(eigenVectors.length).fill(0));

    for (let col = 0; col < pairs.length; col++) {
      const sourceCol = pairs[col].idx;
      for (let row = 0; row < eigenVectors.length; row++) {
        sortedVectors[row][col] = eigenVectors[row][sourceCol];
      }
    }

    return { eigenValues: sortedValues, eigenVectors: sortedVectors };
  }
}
