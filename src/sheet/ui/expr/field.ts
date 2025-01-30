import type { Expr } from "."
import { FieldComputed } from "../../deps"

export class Field extends FieldComputed {
  constructor(
    readonly expr: Expr,
    className?: string,
  ) {
    super(expr.sheet.scope, className)
  }

  recompute(): void {
    this.expr.compute()
    this.expr.display()
  }
}
