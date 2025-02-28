import { Expr } from "."
import { D, L, U, type Dir, type VDir } from "../../../field/model"
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

  onVertOut(towards: VDir): void {
    const ref = this.expr.ref.offset(towards / 2)

    if (ref) {
      ref.focus()
    } else if (towards == D) {
      const expr = Expr.of(this.expr.sheet)
      setTimeout(() => expr.field.el.focus())
    }
  }

  onDelOut(towards: Dir): void {
    if (!this.expr.field.block.isEmpty()) {
      return
    }

    const idx = this.expr.ref.index()
    if (idx == -1) return

    if (this.expr.removable) {
      this.expr.ref.delete()
    }

    const nextIndex =
      !this.expr.removable ?
        towards == L ?
          Math.max(0, idx - 1)
        : idx + 1
      : towards == L ? Math.max(0, idx - 1)
      : idx

    const next = this.expr.ref.list.items[nextIndex]

    if (next) {
      next.focus(towards == L ? D : U)
    } else {
      const expr = Expr.of(this.expr.sheet)
      setTimeout(() => expr.field.el.focus())
    }
  }

  onPaste(event: ClipboardEvent): void {
    const data = event.clipboardData?.getData("text/plain") ?? ""
    if (!data) return
    const [self, ...rest] = data.split("\n")
    this.typeLatex(self!)

    if (!rest.length) return
    this.expr.ref.pasteBelow(rest)
  }
}
