export interface Plottable<T, V> {
  order(data: T): number
  items(data: T): V[]
  draw(data: T, item: V, index: number): void
}
