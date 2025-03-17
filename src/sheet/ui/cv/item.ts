import { FnDist } from "../../../eval/ops/dist"
import type { JsVal, JsValue, TyName, Val } from "../../../eval/ty"
import { num, unpt } from "../../../eval/ty/create"
import { TY_INFO, type TyGlide } from "../../../eval/ty/info"
import { Block } from "../../../field/model"
import type { Point } from "../../point"
import type { Expr } from "../expr"
import type { Sheet } from "../sheet"
import {
  virtualGlider,
  virtualIntersection,
  virtualPoint3,
} from "./item-virtual"
import type { ItemData, ItemWithDrawTarget, ItemWithTarget } from "./move"

export const FN_INTERSECTION = new FnDist<"point32">(
  "intersection",
  "constructs the point where two objects intersect",
)

export const FN_GLIDER = new FnDist<"point32">(
  "glider",
  "constructs a point on an object",
)

/** Hints as to what we're trying to pick. */
export class Hint {
  /** A hint which looks for one object. */
  static one(tys: readonly TyName[] | null = null) {
    return new Hint(tys, 1, false)
  }

  /** A hint which looks for or creates a point. */
  static pt() {
    return new Hint(
      Object.entries(TY_INFO)
        .filter(([, v]) => v.point)
        .map(([k]) => k as TyName),
      // `2` since we might have two glidable objects
      2,
      true,
    )
  }

  constructor(
    /** If absent, all types are available. */
    readonly tys: readonly TyName[] | null,

    /** Limits the number of results. */
    readonly limit: number,

    /** Whether virtual points, gliders, and intersections are allowed. */
    readonly virtualPoint: boolean,
  ) {}

  allows(ty: TyName) {
    return (
      this.tys == null ||
      this.tys.includes(ty) ||
      (this.virtualPoint && !!TY_INFO[ty].glide)
    )
  }

  /** Finds the targeted item. A point must be passed to make gliders work. */
  pick(
    sheet: Sheet,
    at: Point,
    raw: ItemWithTarget[],
  ): ItemWithDrawTarget | undefined {
    if (!this.virtualPoint) {
      return raw[0]
    }

    const items = raw.map((item) => ({ item, val: item.target.val(item) }))

    const [a, b] = items

    if (a) {
      // If a non-point was priority requested, take it
      if (!this.tys || this.tys.includes(a.val.type)) {
        return a.item
      }

      if (TY_INFO[a.val.type].point) {
        return a.item
      }

      intersection: if (b) {
        const o1 = FN_INTERSECTION.o.some(
          (o) =>
            o.params?.length == 2 &&
            o.params[0] == a.val.type &&
            o.params[1] == b.val.type,
        )

        const o2 = FN_INTERSECTION.o.some(
          (o) =>
            o.params?.length == 2 &&
            o.params[0] == b.val.type &&
            o.params[1] == a.val.type,
        )

        let p1 = o1 && FN_INTERSECTION.js1(a.val, b.val)
        if (!(p1 && isFinite(num(p1.value.x)) && isFinite(num(p1.value.y)))) {
          p1 = false
        }

        let p2 = o2 && FN_INTERSECTION.js1(b.val, a.val)
        if (!(p2 && isFinite(num(p2.value.x)) && isFinite(num(p2.value.y)))) {
          p2 = false
        }

        if (!(p1 || p2)) break intersection

        let arg1 = a
        let arg2 = b

        if (p2) {
          if (p1) {
            // Offset distance is used instead of paper distance since in a
            // stretched graph, offset distance matters more to the user than
            // paper distance.
            const o1 = sheet.cv.toOffset(unpt(p1.value))
            const o2 = sheet.cv.toOffset(unpt(p2.value))
            const d1 = Math.hypot(o1.x - at.x, o1.y - at.y)
            const d2 = Math.hypot(o2.x - at.x, o2.y - at.y)
            if (d2 < d1) {
              arg1 = b
              arg2 = a
            }
          } else {
            arg1 = b
            arg2 = a
          }
        }

        return virtualIntersection(sheet, arg1.item, arg2.item)
      }

      glider: {
        const { glide } = TY_INFO[a.val.type]
        if (!glide) break glider

        return virtualGlider(
          sheet,
          a.item,
          (glide as TyGlide<Val>)({
            cv: sheet.cv,
            point: sheet.cv.toPaper(at),
            shape: a.val.value,
          }),
        )
      }
    }

    return virtualPoint3(sheet, sheet.cv.toPaper(at))
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

  /**
   * If this returns a point, it is used as the simulated "origin" for a drag
   * operation. For example, this prevents points from unexpectedly jumping if
   * the user starts dragging them from far off their actual center.
   *
   * The origin should be in offset coordinates.
   *
   * If this returns `null`, the item cannot be dragged.
   */
  dragOrigin?(target: ItemData<T, U>): Point | null

  /** Must be present if {@linkcode Target.dragOrigin} returns a point. */
  drag?(target: ItemData<T, U>, at: Point): void
}

/** Something which can be plotted on the plain canvas. */
export interface Plottable<T, U> {
  order(data: T): number | null
  items(data: T): U[]
  draw(data: T, item: U, index: number): void
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
