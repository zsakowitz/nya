import { U, type Dir, type VDir } from "@/field/dir"
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
    try {
      this.expr.entry.setTo(this.block.parseTopLevel(), !this.leaf)
    } catch (e) {
      console.warn(`[recompute parse]`, e)
      this.expr.entry.setToError(e)
    }
    // this.expr.compute()
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
