# Distance

## Euclidean Distance
**Euclidean distance** (also known as *L2 distance*) is a distance metric between two points in a N dimensional space. It is the square root of the sum of the squared differences of their coordinates.

```ts
import { Distance } from './distance';

const distance = Distance.euclideanDistance([1, 2], [3, 4]);
console.log(distance);  // 2.8284271247461903
```



## Manhattan Distance
**Manhattan distance** (also known as *L1 distance*) is a distance metric between two points in a N dimensional space. It is the sum of the absolute differences of their coordinates. It is called Manhattan distance because it is similar to the distance a car would travel on a grid-like road system (like the streets of Manhattan) to reach from point A to point B.

```ts
import { Distance } from './distance';

const distance = Distance.manhattanDistance([1, 2], [3, 4]);
console.log(distance);  // 4
```


## Minkowski Distance
TBA

## Cosine Similarity
TBA

## Jaccard Similarity
TBA

## Hamming Distance
TBA

## Levenshtein Distance
the **Levenshtein distance** is a string metric for measuring the difference between two sequences. The Levenshtein distance between two words is the minimum number of single-character edits (insertions, deletions or substitutions) required to change one word into the other. It is named after Soviet mathematician Vladimir Levenshtein, who defined the metric in 1965.

```ts
import { Distance } from './distance';

const distance = Distance.levenshteinDistance('kitten', 'sitting');
console.log(distance);  // 3
```



## Jaro-Winkler Distance
TBA

## Sørensen-Dice Coefficient
TBA

## Tversky Index
TBA

## Mahalanobis Distance
TBA

## Canberra Distance
TBA

## Bray-Curtis Distance
TBA

## Chebyshev Distance
TBA

## Haversine Distance
TBA
