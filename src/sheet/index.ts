import { Field } from "../field/field"
import { h } from "../field/jsx"
import { D, U, type Dir, type VDir } from "../field/model"
import type { Exts, Options as FieldOptions } from "../field/options"

export interface Options {
  field: FieldOptions
}

class ExprField extends Field {
  constructor(readonly expr: Expr) {
    super(expr.sheet.exts, expr.sheet.options.field)

    this.el.classList.add(
      "border-[1rem]",
      "border-transparent",
      "min-w-full",
      "focus:outline-none",
    )
  }

  onVertOut(towards: VDir): void {
    const next =
      this.expr.sheet.exprs[this.expr.index + (towards == U ? -1 : 1)]

    if (next) {
      next.field.el.focus()
    } else if (towards == D) {
      const expr = new Expr(this.expr.sheet)
      setTimeout(() => expr.field.el.focus())
    }
  }

  onDelOut(towards: Dir): void {
    if (!this.expr.field.block.isEmpty() || !this.expr.removable) {
      return
    }

    const index = this.expr.index
  }
}

export class Expr {
  readonly field
  readonly el
  readonly elIndex

  removable = false
  index

  constructor(readonly sheet: Sheet) {
    this.sheet.exprs.push(this)
    this.field = new ExprField(this)
    this.el = h(
      "border-b border-slate-200 grid grid-cols-[2.5rem,auto] relative group focus-within:border-[color:--nya-focus]",
      h(
        "inline-flex bg-slate-100 flex-col p-0.5 group-focus-within:bg-[color:--nya-focus] border-r border-slate-200 group-focus-within:border-transparent",
        (this.elIndex = h(
          "text-[65%] [line-height:1] text-slate-500 group-focus-within:text-white",
          "" + this.sheet.exprs.length,
        )),
      ),
      h(
        "inline-block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem]",
        this.field.el,
      ),
      h(
        "absolute -inset-y-px right-0 left-0 border-2 border-[color:--nya-focus] hidden group-focus-within:block pointer-events-none",
      ),
    )
    sheet.elExpressions.insertBefore(this.el, sheet.elExpressions.lastChild)
    this.sheet.checkNextIndex()
    this.index = this.sheet.exprs.length - 1
  }

  checkIndex() {
    this.elIndex.textContent = "" + this.sheet.exprs.indexOf(this)
    this.index = this.sheet.exprs.length - 1
  }
}

export class Sheet {
  readonly exprs: Expr[] = []

  readonly el
  readonly elExpressions
  readonly elNextIndex
  readonly elNextExpr

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    const elExpressions = (this.elExpressions = h(
      "flex flex-col",
      (this.elNextExpr = h(
        "grid grid-cols-[2.5rem,auto] relative pointer-cursor",
        h(
          "inline-flex bg-slate-100 flex-col p-0.5 border-r border-slate-200",
          (this.elNextIndex = h(
            "text-[65%] [line-height:1] text-slate-500",
            "1",
          )),
        ),
        h(
          "font-['Symbola','Times',sans-serif] [line-height:1] min-h-[3.265rem]",
        ),
        h(
          "absolute inset-0 size-full from-transparent to-white bg-gradient-to-b",
        ),
      )),
    ))

    this.elNextExpr.addEventListener("mousedown", () => {
      const expr = new Expr(this)
      setTimeout(() => expr.field.el.focus())
    })

    this.el = h(
      "block fixed inset-0 grid grid-cols-[300px,auto] select-none [--nya-focus:theme(colors.blue.400)]",
      h(
        "block h-full overflow-y-auto border-r",
        h(
          "flex flex-col",
          h(
            "h-12 w-full bg-slate-100 border-b border-slate-200",
            "hello world",
          ),
          elExpressions,
        ),
      ),
    )
  }

  checkIndices() {
    for (let i = 0; i < this.exprs.length; i++) {
      this.exprs[i]!.elIndex.textContent = "" + i
      this.exprs[i]!.index = i
    }
  }

  checkNextIndex() {
    ;(
      this.elExpressions.lastChild as HTMLElement
    ).children[0]!.children[0]!.textContent = this.exprs.length + 1 + ""
  }
}
