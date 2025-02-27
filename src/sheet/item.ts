import type { Sheet } from "./ui/sheet"

export interface ItemFactory<T> {
  id: string
  name: string
  icon(): HTMLElement

  init(sheet: Sheet): T
  el(data: T, index: Text): HTMLElement

  encode(data: T): string
  decode(sheet: Sheet, source: string): T

  /**
   * Defaults to zero; if two items are loaded with the same ID, the higher one
   * wins. If the same layer is added twice, the earlier one wins.
   */
  layer?: number
}

export type AnyItemFactory = ItemFactory<any>
