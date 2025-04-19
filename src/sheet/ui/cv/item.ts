import type { JsVal, JsValue, TyName, Val } from "@/eval/ty"
import { TY_INFO, type TyGlide } from "@/eval/ty/info"
import { Block } from "@/field/model"
import type { Point } from "../../point"
import type { Expr } from "../expr"
import type { Sheet } from "../sheet"
import { Size } from "./consts"
import {
  FN_GLIDER,
  FN_INTERSECTION,
  virtualGlider,
  virtualIntersection,
  virtualPoint3,
} from "./item-virtual"
import type {
  ItemData,
  ItemWithDrawTarget,
  ItemWithTarget,
  VirtualPoint,
} from "./move"

// DEBT: use direct export
export { FN_GLIDER, FN_INTERSECTION }

/** Hints as to what we're trying to pick. */
export class Hint {
  /** A hint which looks for one object. */
  static one(tys: readonly TyName[] | null = null, createdPoint = false) {
    return new Hint(tys, 1, false, createdPoint)
  }

  /**
   * A hint which looks for one of a set of types, setting `derivedPoint` and
   * `createdPoint` if available for the given type set.
   */
  static oneOf(tys: readonly TyName[], virtuals: readonly VirtualPoint[] = []) {
    const pt = tys.some((x) => TY_INFO[x].point)
    return new Hint(tys, pt ? 2 : 1, pt, pt, virtuals)
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
      true,
    )
  }

  readonly maxOrder

  private constructor(
    /** If absent, all types are available. */
    readonly tys: readonly TyName[] | null,

    /** Limits the number of results. */
    readonly limit: number,

    /**
     * Whether gliders and intersections should be preferred if the cursor is
     * near a glidable object.
     */
    private readonly derivedPoint: boolean,

    /** Whether a new point can be created if no other objects are nearby. */
    private readonly createdPoint: boolean,

    /**
     * Virtual points which have already been created, to be searched before
     * everything else.
     */
    readonly virtuals: readonly VirtualPoint[] = [],
  ) {
    this.maxOrder =
      tys ?
        Math.max(...tys.map((x) => TY_INFO[x].order ?? -Infinity))
      : Math.max(...Object.values(TY_INFO).map((x) => x.order ?? -Infinity))
  }

  allows(ty: TyName) {
    return (
      this.tys == null ||
      this.tys.includes(ty) ||
      (this.derivedPoint && !!TY_INFO[ty].glide)
    )
  }

  /** Finds the targeted item. A point must be passed to make gliders work. */
  pick(
    sheet: Sheet,
    at: Point,
    raw: ItemWithTarget[],
  ): ItemWithDrawTarget | undefined {
    if (!this.tys || this.tys.some((x) => TY_INFO[x].point)) {
      const pp = sheet.cv.toPaper(at)
      for (const pt of this.virtuals) {
        if (sheet.cv.offsetDistance(pp, pt.virtualPoint) < Size.Target) {
          return pt
        }
      }
    }

    if (!(this.derivedPoint || this.createdPoint)) {
      return raw[0]
    }

    const items = raw.map((item) => ({ item, val: item.target.val(item) }))

    const [a, b] = items

    if (
      a &&
      (!this.tys || this.tys.includes(a.val.type) || TY_INFO[a.val.type].point)
    ) {
      return a.item
    }

    if (this.derivedPoint && a) {
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

        let p1 = o1 && FN_INTERSECTION.js1(sheet.scope.ctxJs, a.val, b.val)
        if (
          !(
            p1 &&
            p1.value.finite() &&
            sheet.cv.offsetDistance(p1.value.xy(), sheet.cv.toPaper(at)) <=
              Size.Target
          )
        ) {
          p1 = false
        }

        let p2 = o2 && FN_INTERSECTION.js1(sheet.scope.ctxJs, b.val, a.val)
        if (
          !(
            p2 &&
            p2.value.finite() &&
            sheet.cv.offsetDistance(p2.value.xy(), sheet.cv.toPaper(at)) <=
              Size.Target
          )
        ) {
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
            const o1 = sheet.cv.toOffset(p1.value.xy())
            const o2 = sheet.cv.toOffset(p2.value.xy())
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

    if (this.createdPoint) {
      return virtualPoint3(sheet, sheet.cv.toPaper(at))
    }
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
