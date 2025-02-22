import type { GlslHelpers, GlslResult } from "../../eval/lib/fn"
import type { JsVal, TyName } from "../../eval/ty"
import type { Block } from "../../field/model"
import { Expr } from "../ui/expr"
import type { Paper, Point } from "../ui/paper"
import type { Paper2 } from "../ui/paper2"

export type Cursor =
  | "default"
  | "pointer"
  | "text"
  | "move"
  | "ew-resize"
  | "ns-resize"

/** An extension to an expression in the sheet interface. */
export interface Ext<T extends {}, U extends {}, V extends {}, W extends {}> {
  /**
   * Attempts to use this extension on a {@linkcode Expr}. May result in:
   *
   * - A nullish value to skip this extension
   * - A non-nullish value to claim the {@linkcode Expr} by this extension
   * - A thrown error to display an error under the expression
   */
  data(expr: Expr): T | null | undefined

  destroy?(data: NoInfer<T>): void
  aside?(data: NoInfer<T>): HTMLElement | undefined
  el?(data: NoInfer<T>): HTMLElement | undefined
  svg?(data: NoInfer<T>, paper: Paper2): void

  plotGl?(data: NoInfer<T>, helpers: GlslHelpers): GlslResult | undefined

  drag?: {
    /** Returning a non-nullish value captures the event. */
    start(data: NoInfer<T>, at: Point): U | null | undefined
    cursor(data: U): Cursor
    move(data: U, to: Point): void
    end(data: U, at: Point): void
  }

  hover?: {
    /** Returning a non-nullish value captures the event. */
    on(data: NoInfer<T>, at: Point): V | null | undefined
    cursor(data: V): Cursor
    off(data: V): void
  }

  select?: {
    ty(data: NoInfer<T>): TyName | null
    dim(data: NoInfer<T>): void
    undim(data: NoInfer<T>): void

    on(data: NoInfer<T>, at: Point): W | null | undefined
    off(data: W): void
    val(data: W): JsVal
    ref(data: W): Block
  }
}

export type AnyExt = Ext<{}, {}, {}, {}>

export function defineExt<
  T extends {},
  U extends {},
  V extends {},
  W extends {},
>(ext: Ext<T, U, V, W>) {
  return ext
}

export class Exts {
  constructor(readonly exts: AnyExt[] = []) {}

  add(ext: AnyExt) {
    this.exts.push(ext)
    return this
  }

  freeze() {
    Object.freeze(this)
    Object.freeze(this.exts)
    return this
  }
}

/**
 * Useful for persisting values which should only be initialized once per
 * {@linkcode Expr}. Essentially a thin wrapper over {@linkcode WeakMap} with
 * auto-initialization designed specifically for {@linkcode Expr}.
 */
export class Store<T extends {}, U extends WeakKey = Expr> {
  data = new WeakMap<U, T>()

  constructor(readonly init: (key: U) => T) {}

  get(key: U) {
    const data = this.data.get(key)
    if (data == null) {
      const data = this.init(key)
      this.data.set(key, data)
      return data
    }
    return data
  }
}

/**
 * A wrapped around a {@linkcode Store} which stores an arbitrary property and
 * re-renders the {@linkcode Expr}'s {@linkcode Paper} when that property's value
 * changes.
 */
export class Prop<T> {
  private store = new Store((expr) => {
    let value = this.init(expr)

    return {
      get() {
        return value
      },
      set(v: T) {
        if (value != v) {
          value = v
          expr.sheet.paper.queue()
          expr.sheet.paper2.queue()
        }
      },
    }
  })

  constructor(readonly init: (expr: Expr) => T) {}

  get(expr: Expr) {
    return this.store.get(expr).get()
  }

  set(expr: Expr, value: T) {
    this.store.get(expr).set(value)
  }
}
