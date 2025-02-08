import type { Point } from "../ui/paper"
import type { Sheet } from "../ui/sheet"

/** Allows objects to be selected from the canvas. */
export interface Picker<in T extends {}, in out U extends {}> {
  id(data: T): number

  /** Finds an object at the cursor's location. */
  find(data: T, at: Point, sheet: Sheet): U | null

  /** Draws both the found object and a ghost of the provisional final object. */
  draw(data: T, value: U | null, sheet: Sheet): void

  /** Selects a given value. */
  select(data: T, value: U, sheet: Sheet): void

  /** Cancels the picking operation. */
  cancel(data: T): void
}

export function createPicker<T extends {}, U extends {}>(picker: Picker<T, U>) {
  return picker
}

export type AnyPick = Picker<{}, {}>
