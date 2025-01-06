import { Field } from "../field/field"
import { d, h } from "../field/jsx"
import type { Exts, Options as FieldOptions } from "../field/options"

export interface Options {
  field: FieldOptions
}

export class Expr {
  readonly field
  readonly el

  constructor(readonly sheet: Sheet) {
    this.field = new Field(this.sheet.exts, this.sheet.options.field)
    this.field.el.classList.add(
      "focus:outline",
      "focus:outline-2",
      "focus:outline-red-500",
      "border-[1rem]",
      "border-transparent",
      "min-w-full",
    )
    this.el = h(
      "border-b border-slate-200 grid grid-cols-[2.5rem,auto] relative",
      h(
        "inline-flex bg-slate-100 flex-col p-0.5",
        h(
          "text-[65%] [line-height:1] text-slate-500",
          sheet.elExpressions.childElementCount + "",
        ),
      ),
      h(
        "overflow-x-auto [&::-webkit-scrollbar]:hidden border-l border-slate-200",
        this.field.el,
      ),
    )
    sheet.elExpressions.insertBefore(this.el, sheet.elExpressions.lastChild)
    ;(
      sheet.elExpressions.lastChild as HTMLElement
    ).children[0]!.children[0]!.textContent =
      sheet.elExpressions.childElementCount + ""
  }
}

export class Sheet {
  readonly el

  readonly elExpressions

  constructor(
    readonly exts: Exts,
    readonly options: Options,
  ) {
    const elExpressions = (this.elExpressions = d(
      "flex flex-col",
      h(
        "grid grid-cols-[2.5rem,auto] relative",
        h(
          "inline-flex bg-slate-100 flex-col p-0.5",
          h("text-[65%] [line-height:1] text-slate-500", "1"),
        ),
        h(
          "font-['Symbola','Times',sans-serif] [line-height:1] border-l border-l-slate-200 min-h-[3.265rem]",
        ),
        h(
          "absolute inset-0 size-full from-transparent to-white bg-gradient-to-b",
        ),
      ),
    ))
    this.el = d(
      "w-[900px] h-[600px] m-4 border border-slate-200 grid grid-cols-[300px,auto] select-none",
      d("h-full overflow-y-auto border-r", elExpressions),
    )
  }
}
