import { Expr } from "../ui/expr"

export interface ExtProps<T extends {}> {
  expr: Expr
  data: NoInfer<T>
}

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

  el?(props: ExtProps<T>): HTMLElement | undefined
  // plot2d?(props: ExtProps<T>, paper: Paper): void
  // plotGl?(props: ExtProps<T>, helpers: GlslHelpers): GlslResult | null
}

export function defineExt<T extends {}>(ext: Ext<T>) {
  return ext
}

export class Exts<T> {
  readonly exts: T[] = []

  add(ext: T) {
    this.exts.push(ext)
    return this
  }

  freeze() {
    Object.freeze(this)
    Object.freeze(this.exts)
    return this
  }
}

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
