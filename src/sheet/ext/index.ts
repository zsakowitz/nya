import type { GlslHelpers, GlslResult } from "../../eval/lib/fn"
import { Expr } from "../ui/expr"
import type { Paper, Point } from "../ui/paper"

export type CursorStyle = "default" | "pointer" | "text" | "move"

export interface ExtPointers<T, U extends {}> {
  /** Returning a non-nullish value captures the event. */
  start(data: T, at: Point): U | null | undefined
  cursor(data: U): CursorStyle
  move(data: U, to: Point): void
  end(data: U, at: Point): void
}

/** An extension to an expression in the sheet interface. */
export interface Ext<T extends {}, U extends {}, V extends {}> {
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
    /** Returning a non-nullish value captures the event. */
    start(data: T, at: Point): U | null | undefined
    cursor(data: U): CursorStyle
    move(data: U, to: Point): void
    end(data: U, at: Point): void
  }

  hover?: {
    /** Returning a non-nullish value captures the event. */
    on(data: T, at: Point): V | null | undefined
    cursor(data: V): CursorStyle
    off(data: V): void
  }
}

export type AnyExt = Ext<{}, {}, {}>

export function defineExt<T extends {}, U extends {}, V extends {}>(
  ext: Ext<T, U, V>,
) {
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
