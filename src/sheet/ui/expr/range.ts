import type { Expr } from "."
import { real } from "../../../eval/ty/create"
import { FieldInert } from "../../../field/field-inert"
import { h } from "../../../jsx"
import { Field } from "./field"
import { ExprScrubber } from "./scrubber"

export class ExprRangeControls {
  readonly min
  private readonly minDisplay
  readonly max
  private readonly maxDisplay
  readonly step
  readonly scrubber

  readonly el
  private readonly elSlider

  constructor(readonly expr: Expr) {
    const { exts, options } = expr.sheet
    this.min = new Field(expr)
    this.minDisplay = new FieldInert(exts, options, "font-sans pb-2")
    this.max = new Field(expr)
    this.maxDisplay = new FieldInert(exts, options, "font-sans pb-2")
    this.step = new Field(expr)

    this.scrubber = new ExprScrubber(
      expr,
      "px-1 pb-2 pt-2 -mt-2 cursor-pointer",
    )

    this.minDisplay.latex`-10`
    this.maxDisplay.latex`10`
    this.scrubber.bounds(real(-10), real(10))

    this.elSlider = h(
      "flex text-[0.6rem] items-center text-slate-500 px-3 -mt-3",
      this.minDisplay.el,
      this.scrubber.el,
      this.maxDisplay.el,
    )

    this.el = h("contents", this.elSlider)
  }
}
