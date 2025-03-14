import type { JsVal, JsValue, TyName, Val } from "../../../eval/ty"
import { Block } from "../../../field/model"
import type { Point } from "../../point"
import type { Expr } from "../expr"
import type { ItemData } from "./move"

/** Hints as to what we're trying to pick. */
export class Hint {
  static one() {
    return new Hint(null, 1)
  }

  constructor(
    /** If absent, all types are available. */
    readonly tys: readonly TyName[] | null,

    /** Limits the number of results. */
    readonly limit: number,
  ) {}

  allows(ty: TyName) {
    return this.tys == null || this.tys.includes(ty)
  }
}

/**
 * `T` is the intrinsic data of the object, while `U` is separate, since a
 * single item may render multiple things to the canvas (e.g. lists).
 */
export interface Target<T, U> {
  /**
   * `at` is in paper coordinates. Returns whether the point hits the provided
   * item.
   */
  hits(target: ItemData<T, U>, at: Point, hint: Hint): boolean

  /**
   * Focuses the item corresponding to the object.
   *
   * Technically this could be left to normal lifecycle things, but it seems
   * annoying to put it everywhere.
   */
  focus(data: T): void

  /** `click` is only emitted with `on = false`. */
  toggle(
    item: ItemData<T, U>,
    on: boolean,
    reason: "pick" | "hover" | "drag" | "click",
  ): void

  /** Gets the value this hit represents. */
  val(target: ItemData<T, U>): JsVal

  /** Creates a reference to the value. */
  ref(target: ItemData<T, U>): Block

  /** Called to check if an item can be dragged. */
  canDrag?(target: ItemData<T, U>): boolean

  /** Must be present if `canDrag` returns `true`. */
  drag?(target: ItemData<T, U>, at: Point): void
}

/** Something which can be plotted on the plain canvas. */
export interface Plottable<T, U> {
  order(data: T): number | null
  items(data: T): U[]
  draw(data: T, item: U): void
  target?: Target<T, U>
}

/** A utility for an incredibly common case of {@linkcode Target.ref}. */
export function ref(props: { data: { expr: Expr }; index: number }) {
  return props.data.expr.createRef(props.index)
}

/** A utility for an incredibly common case of {@linkcode Target.val}. */
export function val(props: { data: { value: JsValue }; item: Val }): JsVal {
  return { type: props.data.value.type, value: props.item }
}
