import { Expr } from "../ui/expr"

export interface ExtProps<T extends {}> {
  expr: Expr
  data: NoInfer<T>
}

/** An extension to an expression in the sheet interface. */
export interface Ext<T extends {}> {
  /** The ID of this extension, for state-saving purposes. */
  id: string

  /**
   * Attempts to use this extension on a {@linkcode Expr}. May result in:
   *
   * - A nullish value to skip this extension
   * - A non-nullish value to claim the {@linkcode Expr} by this extension
   * - A thrown error to display an error under the expression
   */
  data(expr: Expr): T | null | undefined

  /** Returns an HTML element which will be appended below the {@linkcode Expr}. */
  el?(props: ExtProps<T>): HTMLElement | undefined

  /** Plots any 2D components this extension renders. */
  // plot2d?(props: ExtProps<T>, paper: Paper): void

  /** Generates shader code to render this element on the shader. */
  // plotGl?(props: ExtProps<T>, helpers: GlslHelpers): GlslResult | null
}

export function defineExt<T extends {}>(ext: Ext<T>) {
  return ext
}

export class Exts {
  readonly exts: Ext<{}>[] = []
  readonly map: Record<string, Ext<{}>> = Object.create(null)

  add(ext: Ext<{}>) {
    this.exts.push(ext)
    this.map[ext.id] = ext
    return this
  }

  freeze() {
    Object.freeze(this)
    Object.freeze(this.exts)
    Object.freeze(this.map)
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
