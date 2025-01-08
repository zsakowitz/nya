import { defaultProps, display, go, type Value } from "../ast/eval"
import { Field } from "../field/field"
import { FieldInert } from "../field/field-inert"
import { h, hx, p, svgx } from "../field/jsx"
import { D, L, R, U, type Dir, type VDir } from "../field/model"
import type { Exts, Options as FieldOptions } from "../field/options"
import {
  createDrawAxes,
  doDrawCycle,
  doMatchSize,
  onPointer,
  onScroll,
  onTouch,
  onWheel,
  Paper,
} from "./paper"

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

    this.el.addEventListener("focus", () => {
      this.expr.sheet.onExprFocus?.(expr)
    })
  }

  onAfterChange(wasChangeCanceled: boolean): void {
    super.onAfterChange(wasChangeCanceled)
    if (!wasChangeCanceled) {
      this.expr?.sheet.onExprChange?.(this.expr)
    }
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
    if (!this.expr.field.block.isEmpty()) {
      return
    }

    const index = this.expr.index

    if (this.expr.removable) {
      this.expr.sheet.exprs.splice(index, 1)
      this.expr.el.remove()
      this.expr.sheet.checkIndices()
    }

    const nextIndex =
      !this.expr.removable ?
        towards == L ?
          Math.max(0, index - 1)
        : index + 1
      : towards == L ? Math.max(0, index - 1)
      : index

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
}

export class Expr {
  readonly field

  readonly el
  readonly elIndex
  readonly elValue
  readonly elValueError
  readonly elScroller

  removable = true
  index

  constructor(readonly sheet: Sheet) {
    this.sheet.exprs.push(this)
    this.field = new ExprField(this)
    this.el = h(
      "border-b border-slate-200 grid grid-cols-[2.5rem,auto] relative group focus-within:border-[color:--nya-focus] max-w-full",
      h(
        "inline-flex bg-slate-100 flex-col p-0.5 group-focus-within:bg-[color:--nya-focus] border-r border-slate-200 group-focus-within:border-transparent",
        (this.elIndex = h(
          "text-[65%] [line-height:1] text-slate-500 group-focus-within:text-white",
          "" + this.sheet.exprs.length,
        )),
      ),
      h(
        "flex flex-col w-full max-w-full",
        (this.elScroller = h(
          "block overflow-x-auto [&::-webkit-scrollbar]:hidden min-h-[3.265rem]",
          this.field.el,
        )),
        (this.elValue = new FieldInert(this.field.exts, this.field.options)).el,
        (this.elValueError = h(
          "leading-tight block pb-1 -mt-2 mx-1 px-1 italic text-red-800 hidden",
        )),
      ),
      h(
        "absolute -inset-y-px right-0 left-0 border-2 border-[color:--nya-focus] hidden group-focus-within:block pointer-events-none",
      ),
    )
    this.field.el.addEventListener("keydown", (event) => {
      if (event.key == "Enter" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        const expr = new Expr(this.sheet)
        this.sheet.exprs.splice(expr.index, 1)
        this.sheet.exprs.splice(this.index + 1, 0, expr)
        this.sheet.checkIndices()
        const before =
          this.sheet.exprs[expr.index + 1]?.el ?? this.sheet.elNextExpr
        this.sheet.elExpressions.insertBefore(expr.el, before)
        setTimeout(() => before.scrollIntoView({ behavior: "instant" }))
        setTimeout(() => expr.field.el.focus())
      }
    })
    sheet.elExpressions.insertBefore(this.el, sheet.elExpressions.lastChild)
    this.sheet.checkNextIndex()
    this.index = this.sheet.exprs.length - 1
    this.fitTo(400)
    this.elValue.el.classList.add(
      "block",
      "bg-slate-100",
      "border",
      "border-slate-200",
      "rounded",
      "px-2",
      "py-1",
      "mx-2",
      "mb-2",
      "-mt-2",
      "self-end",
    )
  }

  displayEval(value: Value) {
    this.elValue.el.classList.remove("hidden")
    this.elValueError.classList.add("hidden")
    display(this.elValue, value)
  }

  displayError(reason: Error) {
    this.elValue.el.classList.add("hidden")
    this.elValueError.classList.remove("hidden")
    this.elValueError.textContent = reason.message
  }

  checkIndex() {
    this.elIndex.textContent = "" + this.sheet.exprs.indexOf(this)
    this.index = this.sheet.exprs.length - 1
  }

  fitTo(width: number) {
    this.elScroller.style.maxWidth = `calc(${width}px - 2.5rem)`
  }
}

export class Sheet {
  readonly exprs: Expr[] = []
  readonly paper = new Paper()

  readonly el
  readonly elExpressions
  readonly elNextIndex
  readonly elNextExpr
  readonly elLogo
  readonly elTokens

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    this.paper.el.classList.add("size-full")
    doMatchSize(this.paper)
    doDrawCycle(this.paper)
    onWheel(this.paper)
    onScroll(this.paper)
    onPointer(this.paper)
    onTouch(this.paper)
    createDrawAxes(this.paper)

    const elExpressions = (this.elExpressions = h(
      "block",
      (this.elNextExpr = h(
        "grid grid-cols-[2.5rem,auto] relative pointernya-cursor",
        h(
          "inline-flex bg-slate-100 flex-col p-0.5 border-r border-slate-200",
          (this.elNextIndex = h(
            "text-[65%] [line-height:1] text-slate-500",
            "1",
          )),
        ),
        h(
          "font-['Symbola','Times_New_Roman',sans-serif] [line-height:1] min-h-[3.265rem]",
        ),
        h(
          "absolute inset-0 size-full from-transparent to-white bg-gradient-to-b",
        ),
      )),
    ))

    let prevWidth = 0

    new ResizeObserver(([entry]) => {
      const width = entry?.borderBoxSize?.[0]?.inlineSize
      if (width == null || width == prevWidth) {
        return
      }
      prevWidth = width
      for (const expr of this.exprs) {
        expr.fitTo(width)
      }
    }).observe(this.elExpressions)
    for (const expr of this.exprs) {
      expr.fitTo(400)
    }

    this.elNextExpr.addEventListener("mousedown", () => {
      const expr = new Expr(this)
      setTimeout(() => expr.field.el.focus())
    })

    this.el = h(
      "block fixed inset-0 grid grid-cols-[400px_1fr] select-none [--nya-focus:theme(colors.blue.400)]",
      h(
        "block overflow-y-auto relative border-r",
        h(
          "block h-12 w-full bg-slate-100 border-b border-slate-200 flex gap-8",
        ),
        elExpressions,
      ),
      (this.elTokens = hx("pre", "h-screen overflow-y-auto")),
      h("flex", this.paper.el),
      (this.elLogo = hx(
        "button",
        "absolute bottom-0 right-0 p-2",
        svgx(
          "0 0 20 16",
          "w-8 fill-slate-400",
          p(
            "M7 0 5 0A1 1 0 004 1L4 3A1 1 0 005 4L7 4A1 1 0 008 3L8 1A1 1 0 007 0ZM3 8 1 8A1 1 0 000 9L0 11A1 1 0 001 12L3 12A1 1 0 014 13L4 15A1 1 0 005 16L7 16 7 16A1 1 0 008 15L8 13A1 1 0 019 12L11 12A1 1 0 0112 13L12 15A1 1 0 0013 16L15 16A1 1 0 0016 15L16 13A1 1 0 0117 12L19 12A1 1 0 0020 11L20 9A1 1 0 0019 8L17 8A1 1 0 0016 9L16 11A1 1 0 0115 12L13 12A1 1 0 0112 11L12 9A1 1 0 0011 8L9 8A1 1 0 008 9L8 11A1 1 0 017 12L5 12A1 1 0 014 11L4 9A1 1 0 003 8ZM15 0 13 0A1 1 0 0012 1L12 3A1 1 0 0013 4L15 4A1 1 0 0016 3L16 1A1 1 0 0015 0Z",
          ),
        ),
      )),
    )
  }

  checkIndices() {
    for (let i = 0; i < this.exprs.length; i++) {
      this.exprs[i]!.elIndex.textContent = i + 1 + ""
      this.exprs[i]!.index = i
    }
    this.checkNextIndex()
  }

  checkNextIndex() {
    this.elNextIndex.textContent = this.exprs.length + 1 + ""
  }

  onExprFocus?(expr: Expr): void {
    this.elTokens.textContent = JSON.stringify(
      expr.field.block.ast(),
      undefined,
      2,
    )
  }

  onExprChange?(expr: Expr): void {
    this.elTokens.textContent = JSON.stringify(
      expr.field.block.ast(),
      undefined,
      2,
    )
    try {
      const node = expr.field.block.ast()
      const value = go(node, defaultProps)
      expr.displayEval(value)
    } catch (e) {
      expr.displayError(e instanceof Error ? e : new Error(String(e)))
    }
  }
}
