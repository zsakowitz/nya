import type { GlslHelpers, GlslResult } from "../../eval/lib/fn"
import { Expr } from "../ui/expr"
import type { Paper, Point } from "../ui/paper"

/** An extension to an expression in the sheet interface. */
export interface Ext<T extends {}, U extends {}> {
  /**
   * Attempts to use this extension on a {@linkcode Expr}. May result in:
   *
   * - A nullish value to skip this extension
   * - A non-nullish value to claim the {@linkcode Expr} by this extension
   * - A thrown error to display an error under the expression
   */
  data(expr: Expr): T | null | undefined

  destroy?(data: T): void
  aside?(data: T): HTMLElement | undefined
  el?(data: T): HTMLElement | undefined

  plot2d?(data: T, paper: Paper): void
  plotGl?(data: T, helpers: GlslHelpers): GlslResult | undefined

  /**
   * Higher `layer` values are higher in the draw stack. When ties are
   * encountered, later expressions are plotted higher.
   *
   * Extensions with higher layers also take precedence for hover and drag
   * operations.
   *
   * GLSL plots are plotted below all 2D plots, despite the layer of the
   * individual expressions.
   */
  layer?(data: T): number | undefined

  drag?: {
    start(data: T, at: Point): U | null | undefined
    move(data: U, to: Point): void
    end(data: U, at: Point): void
  }
}

export type AnyExt = Ext<{}, {}>

export function defineExt<T extends {}, U extends {}>(ext: Ext<T, U>) {
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
export class Store<T extends {}> {
  data = new WeakMap<Expr, T>()

  constructor(readonly init: (expr: Expr) => T) {}

  get(expr: Expr) {
    const data = this.data.get(expr)
    if (data == null) {
      const data = this.init(expr)
      this.data.set(expr, data)
      return data
    }
    return data
  }
}
