import { Prop } from "./sheet/ext"
import type { Expr } from "./sheet/ui/expr"

export const PROP_SHOWN = new Prop(() => false)

export function show(expr: Expr) {
  PROP_SHOWN.set(expr, true)
}
