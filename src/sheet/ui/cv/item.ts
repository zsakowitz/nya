import type { JsVal, TyName } from "../../../eval/ty"
import { Block } from "../../../field/model"
import type { Point } from "../../point"

/** Hints as to what we're trying to pick. */
export interface Hint {
  /** If absent, all types are available. */
  readonly tys?: readonly TyName[]
}

/**
 * `T` is the intrinsic data of the object, while `U` is separate, since a
 * single item may render multiple things to the canvas (e.g. lists).
 */
export interface Target<T, U> {
  /** Returns appropriate data for each intersection. */
  hits(data: T, at: Point, hint: Hint): U[]

  /**
   * Focuses the item corresponding to the object.
   *
   * Technically this could be left to normal lifecycle things, but it seems
   * annoying to put it everywhere.
   */
  focus(data: U): void

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
  toggle(data: U, on: boolean, reason: "pick" | "hover" | "drag"): void

  /** Gets the value this hit represents. */
  val(data: U): JsVal

  /** Creates a reference to the value. */
  ref(data: U): Block

  /**
   * Called when the cursor moves to a spot. Normally, the cursor will be locked
   * onto that item; return `false` to give up pointer lock.
   */
  move?(data: U, at: Point): boolean
}

/** Something which can be plotted on the plain canvas. */
export interface Plottable<T, U> {
  order: number
  // Technically, `draw` is never passed a paper, and neither is any of this, so
  // there's no technical reason to put it in the `paper3` folder. It's here
  // anyway because it's typically only used for plotting items on the paper.
  draw(data: T): void
  target?: Target<T, U>
}
