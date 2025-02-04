import type { Expr } from "./expr"

export interface ExtProps<T> {
  /** The expression the extension is currently applying to. */
  expr: Expr

  /** The data saved in this expression's state. */
  data: T
}

/** An extension to an expression in the sheet interface. */
export interface Ext<T> {
  /** The ID of this extension, for state-saving purposes. */
  id: string

  /**
   * Attempts to use this extension on a {@linkcode Expr}. May result in:
   *
   * - A nullish value to skip this extension
   * - A non-nullish value to claim the {@linkcode Expr} by this extension
   * - A thrown error to display an error under the expression
   */
  getState(expr: Expr): T | null | undefined

  /** Returns an HTML element which will be appended below the {@linkcode Expr}. */
  el?(props: ExtProps<T>): HTMLElement | undefined

  /** Plots any 2D components this extension renders. */
  // plot2d?(props: ExtProps<T>, paper: Paper): void

  /** Generates shader code to render this element on the shader. */
  // plotGl?(props: ExtProps<T>, helpers: GlslHelpers): GlslResult | null
}
