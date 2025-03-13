import type { JsVal, TyName } from "../../../eval/ty"
import { Block } from "../../../field/model"
import type { Point } from "../../point"

/** Hints as to what we're trying to pick. */
interface Hint {
  /** If absent, all types are available. */
  readonly tys?: readonly TyName[]
}

/**
 * `T` is the intrinsic data of the object, while `U` is separate, since a
 * single item may render multiple things to the canvas (e.g. lists).
 */
interface Target<T, U> {
  /** Returns appropriate data for each intersection. */
  hits(data: T, item: U, at: Point, hint: Hint): boolean

  /**
   * Focuses the item corresponding to the object.
   *
   * Technically this could be left to normal lifecycle things, but it seems
   * annoying to put it everywhere.
   */
  focus(data: T): void

  /**
   * Different reasons are passed for different events:
   *
   * - `pick`: the item is hovered on or off during picking
   * - `hover`: the item is hovered on or off not during picking
   * - `drag`: the item is hovered on or off and the pointer is down
   *
   * Thus, these lifecycles are possible:
   *
   * 1. `true "pick"`, then `false "pick"`.
   * 2. `true "hover"`, then `.focus()`, then `false "hover"`.
   * 3. `true "hover"`, then `true "drag"`, then `false "drag"`, then `false
   *    "hover"`.
   */
  toggle(
    data: T,
    item: U,
    index: number,
    on: boolean,
    reason: "pick" | "hover" | "drag",
  ): void

  /** Gets the value this hit represents. */
  val(data: T, item: U): JsVal

  /** Creates a reference to the value. */
  ref(data: T, item: U): Block

  /**
   * Called when the item is dragged. Normally, the cursor will stay locked onto
   * this item until it is raised; returning `false` will override that and
   * release the lock.
   */
  drag?(data: T, item: U, at: Point): boolean
}

/** Something which can be plotted on the plain canvas. */
export interface Plottable<T, U> {
  order: number
  items(data: T): U[]
  draw(data: T, item: U): void
  target?: Target<T, U>
}
