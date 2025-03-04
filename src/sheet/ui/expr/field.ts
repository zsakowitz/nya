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
    const ref = this.expr.ref.offset(towards)

    if (ref) {
      ref.focus()
    } else if (towards == D) {
      this.expr.ref.root.createDefault({ focus: true })
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

    const next = this.expr.ref.root.items[nextIndex]

    if (next) {
      next.focus(towards == L ? D : U)
    } else if (towards == L) {
      this.expr.ref.root.createDefault({ focus: true })
    } else {
      const prev = this.expr.ref.root.items[idx - 1]
      if (prev) {
        prev.focus(D)
      } else {
        this.expr.ref.root.createDefault({ focus: true })
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
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
