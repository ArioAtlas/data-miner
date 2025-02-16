/**
 * A helper PriorityQueue. Feel free to use any library or adapt this.
 * This is a minimal binary heap that extracts the maximum deltaQ quickly.
 */
export class MaxHeap<T extends { deltaQ: number }> {
  private heap: T[] = [];

  public size(): number {
    return this.heap.length;
  }

  public insert(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public extractMax(): T | undefined {
    if (this.heap.length === 0) return undefined;
    this.swap(0, this.heap.length - 1);
    const max = this.heap.pop();
    this.bubbleDown(0);
    return max;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[index].deltaQ <= this.heap[parent].deltaQ) break;
      this.swap(index, parent);
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let largest = index;

      if (left < length && this.heap[left].deltaQ > this.heap[largest].deltaQ) {
        largest = left;
      }
      if (right < length && this.heap[right].deltaQ > this.heap[largest].deltaQ) {
        largest = right;
      }
      if (largest === index) break;

      this.swap(index, largest);
      index = largest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}
