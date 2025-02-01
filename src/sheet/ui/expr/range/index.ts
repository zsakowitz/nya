import type { Expr } from ".."
import type { PlainVar } from "../../../../eval/ast/token"
import type { SReal } from "../../../../eval/ty"
import { real } from "../../../../eval/ty/create"
import { OpLt } from "../../../../field/cmd/leaf/cmp"
import { FieldInert } from "../../../../field/field-inert"
import { L, Selection } from "../../../../field/model"
import { h } from "../../../../jsx"
import { Field } from "./field"
import { ExprScrubber } from "./scrubber"

export interface ExprRangeState {
  type: "range"
  name: PlainVar
  value: SReal
  base: SReal | null
}

export interface RangeState {
  min: SReal | string
  max: SReal | string
  step: SReal | string | null
}

export class RangeControls {
  readonly min
  private readonly minDisplay
  readonly max
  private readonly maxDisplay
  readonly step
  readonly scrubber
  readonly name

  readonly el
  private readonly elSlider
  private readonly elBounds

  // readonly state

  constructor(readonly expr: Expr) {
    const { exts, options } = expr.sheet
    const CLSX =
      "text-[1rem] p-1 pr-2 border-b border-slate-200 min-w-12 max-w-24 min-h-[calc(1.5rem_+_1px)] focus:outline-none focus:border-b-blue-400 focus:border-b-2 [&::-webkit-scrollbar]:hidden overflow-x-auto align-middle focus:-mb-px"
    this.min = new Field(this, CLSX)
    this.min.leaf = true
    this.max = new Field(this, CLSX)
    this.max.leaf = true
    this.step = new Field(this, CLSX)
    this.step.leaf = true
    for (const field of [this.min, this.max, this.step]) {
      field.el.addEventListener("focus", () => {
        field.onBeforeChange()
        field.sel = new Selection(field.block, null, null, L)
        field.onAfterChange(false)
      })
    }
    this.minDisplay = new FieldInert(exts, options, "font-sans pb-2")
    this.maxDisplay = new FieldInert(exts, options, "font-sans pb-2")
    this.name = new FieldInert(exts, options, "text-[1em]")

    this.scrubber = new ExprScrubber(
      expr,
      "px-1 pb-2 pt-2 -mt-2 cursor-pointer",
    )

    this.min.latex`-10`
    this.minDisplay.latex`-10`
    this.max.latex`10`
    this.maxDisplay.latex`10`
    this.name.latex`a`
    this.scrubber.bounds(real(-10), real(10))

    this.elSlider = h(
      "flex text-[0.6rem] items-center text-slate-500 px-3 -mt-3 [.nya-expr:focus-within_&:not(:focus-within)]:sr-only",
      this.minDisplay.el,
      this.scrubber.el,
      this.maxDisplay.el,
    )
    this.elBounds = h(
      "block -mt-2 px-4 leading-none pb-2 text-[1.265em] [.nya-expr:not(:focus-within)_&]:sr-only [:focus-within>&:not(:focus-within)]:sr-only",
      this.min.el,
      " ",
      new OpLt(false, true).el,
      this.name.el,
      new OpLt(false, true).el,
      " ",
      this.max.el,
      h("ml-4 font-sans text-sm text-slate-800", "Step: "),
      this.step.el,
    )

    this.el = h("contents", this.elBounds, this.elSlider)
  }
}
