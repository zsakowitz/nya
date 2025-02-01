import type { RangeControls } from "."
import { FieldComputed } from "../../../deps"

export class Field extends FieldComputed {
  constructor(
    readonly controls: RangeControls,
    className?: string,
  ) {
    super(controls.expr.sheet.scope, className)
  }

  recompute(): void {
    // this.expr.compute()
    // this.expr.display()
  }
}
