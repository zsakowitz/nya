import type { GlslHelpers, GlslResult } from "../../eval/lib/fn"
import { Expr } from "../ui/expr"
import type { Paper } from "../ui/paper"

/** An extension to an expression in the sheet interface. */
export interface Ext<T extends {}> {
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
}

export function defineExt<T extends {}>(ext: Ext<T>) {
  return ext
}

export class Exts {
  constructor(readonly exts: Ext<{}>[] = []) {}

  add(ext: Ext<{}>) {
    this.exts.push(ext)
    return this
  }

  freeze() {
    Object.freeze(this)
    Object.freeze(this.exts)
    return this
  }
}

/** Useful for persisting init-once values based on an {@linkcode Expr}. */
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
