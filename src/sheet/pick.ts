import type { Point } from "@/lib/point"
import type { ItemRef } from "./items"
import type { Sheet } from "./ui/sheet"

/** Simple API for picking objects off the canvas. */
export interface Picker<in T extends {}, in out U extends {}> {
  id(data: T): number
  init(data: T, sheet: Sheet): void
  find(data: T, at: Point, sheet: Sheet): U | null
  draw(data: T, found: U | null, sheet: Sheet): void
  /** Returns the next picker to be used. */
  select(data: T, found: U, sheet: Sheet): AnyPickInit | null
  cancel(data: T, sheet: Sheet): void
  /** If an expression is returned, its draw is suppressed. */
  suppress?(data: T, found: U | null): ItemRef<unknown> | null
}

interface PickerInit<T extends {}, U extends {}> {
  pick: Picker<T, U>
  data: T
}

export type AnyPick = Picker<any, any>

type AnyPickInit = PickerInit<any, any>
