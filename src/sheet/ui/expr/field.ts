import type { Expr } from "."
import { FieldComputed } from "../../deps"

export class Field extends FieldComputed {
  constructor(readonly expr: Expr) {
    super(expr.sheet.scope)
  }

  recompute(): void {
    this.expr.compute()
    this.expr.display()
  }
}
