import type { JsValue, SReal } from "../../eval/ty"
import { Expr } from "../ui/expr"
import type { Paper } from "../ui/paper"

export interface TyExtProps<T extends {}> {
  expr: Expr
  value: JsValue
  base: SReal
  data: NoInfer<T>
}

export type TyInitProps<T extends {}> = Omit<TyExtProps<T>, "data">

/**
 * An extension which operates on a specific type of value evaluatable in
 * JS-land.
 */
export interface TyExt<T extends {}> {
  /**
   * Attempts to use this extension on a {@linkcode Expr}. May result in:
   *
   * - A nullish value to skip this extension
   * - A non-nullish value to claim the {@linkcode Expr} by this extension
   * - A thrown error to display an error under the expression
   */
  data(props: TyInitProps<T>): T | null | undefined

  el?(props: TyExtProps<T>): HTMLElement | undefined
  plot2d?(props: TyExtProps<T>, paper: Paper): void
  // plotGl?(props: ExtProps<T>, helpers: GlslHelpers): GlslResult | null
}

export function defineTyExt<T extends {}>(ext: TyExt<T>) {
  return ext
}
