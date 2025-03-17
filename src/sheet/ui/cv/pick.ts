import type { ItemRef } from "../../items"
import type { Sheet } from "../sheet"
import type { Hint } from "./item"
import type { ItemWithTarget, PointerHandlerRet } from "./move"

export interface Picker<T extends {}> {
  id(data: T): number
  hint(data: T): Hint
  draw(data: T): void
  take(data: T, item: ItemWithTarget | null): T | null
  /** Suppresses the rendering of a particular item. */
  suppress(data: T, item: ItemWithTarget | null): ItemRef<unknown> | null
}

export class PickHandler2 {
  constructor(
    private readonly sheet: Sheet,
    private readonly data: PointerHandlerRet,
  ) {
    data.oc = () => {
      console.log(Math.random())
    }
  }
}
