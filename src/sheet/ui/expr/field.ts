import type { Expr } from "."
import { U, type Dir, type VDir } from "@/field/model"
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

  onVertOut(towards: VDir) {
    this.expr.ref.onVertOut(towards)
  }

  onDelOut(towards: Dir) {
    this.expr.ref.onDelOut(towards, this.expr.field.block.isEmpty())
  }

  onPaste(event: ClipboardEvent) {
    const data = event.clipboardData?.getData("text/plain") ?? ""
    if (!data) return
    const [self, ...rest] = data.split("\n")
    if (self!.startsWith("#")) {
      this.expr.ref.pasteBelow([self!, ...rest])
      if (this.block.isEmpty()) {
        let idx = this.expr.ref.index()
        this.expr.ref.delete()
        this.expr.ref.root.items[idx]?.focus(U)
      }
      return
    }

    this.typeLatex(self!)

    if (!rest.length) return
    this.expr.ref.pasteBelow(rest)
  }
}
