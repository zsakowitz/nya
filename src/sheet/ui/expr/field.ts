import { Expr } from "."
import { D, L, R, type Dir, type VDir } from "../../../field/model"
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
    const idx = this.expr.sheet.exprs.indexOf(this.expr)
    if (idx == -1) return

    const next = this.expr.sheet.exprs[idx + towards / 2]

    if (next) {
      next.field.el.focus()
    } else if (towards == D) {
      const expr = new Expr(this.expr.sheet)
      setTimeout(() => expr.field.el.focus())
    }
  }

  onDelOut(towards: Dir): void {
    if (!this.expr.field.block.isEmpty()) {
      return
    }

    const idx = this.expr.sheet.exprs.indexOf(this.expr)
    if (idx == -1) return

    if (this.expr.removable) {
      this.expr.sheet.exprs.splice(idx, 1)
      this.expr.el.remove()
      this.expr.sheet.queueIndices()
    }

    const nextIndex =
      !this.expr.removable ?
        towards == L ?
          Math.max(0, idx - 1)
        : idx + 1
      : towards == L ? Math.max(0, idx - 1)
      : idx

    const next = this.expr.sheet.exprs[nextIndex]

    if (next) {
      next.field.onBeforeChange()
      next.field.sel = next.field.block.cursor(towards == L ? R : L).selection()
      next.field.onAfterChange(false)
      next.field.el.focus()
    } else {
      const expr = new Expr(this.expr.sheet)
      setTimeout(() => expr.field.el.focus())
    }
  }

  onPaste(event: ClipboardEvent): void {
    const data = event.clipboardData?.getData("text/plain") ?? ""
    if (!data) return
    const [self, ...rest] = data.split("\n")
    this.typeLatex(self!)

    if (!rest.length) return
    const { exprs } = this.expr.sheet
    let el = this.expr.el

    let idx = exprs.indexOf(this.expr) + 1
    if (!idx) idx = exprs.length
    for (const latex of rest) {
      const expr = new Expr(this.expr.sheet)
      exprs.pop()
      exprs.splice(idx, 0, expr)
      expr.field.typeLatex(latex)
      el.insertAdjacentElement("afterend", expr.el)
      el = expr.el
      idx++
    }
    this.expr.sheet.queueIndices()
  }
}
