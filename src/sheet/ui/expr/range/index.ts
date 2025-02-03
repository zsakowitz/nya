import type { Expr } from ".."
import type { PlainVar } from "../../../../eval/ast/token"
import type { SReal } from "../../../../eval/ty"
import { num } from "../../../../eval/ty/create"
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
  readonly max
  readonly step
  readonly scrubber
  readonly name

  readonly el

  constructor(readonly expr: Expr) {
    this.min = new Field(this, "order-1")
    this.max = new Field(this, "order-3")
    this.step = new Field(this)
    for (const field of [this.min, this.max, this.step]) {
      field.el.addEventListener("focus", () => {
        field.onBeforeChange()
        field.sel = new Selection(field.block, null, null, L)
        field.onAfterChange(false)
      })
    }
    this.name = new FieldInert(expr.sheet.options, "text-[1em]")

    this.scrubber = new ExprScrubber(
      expr,
      "nya-range-scrubber px-1 pb-2 pt-2 -mt-2 cursor-pointer order-2",
    )

    this.el = h(
      "nya-range",
      this.min.el,
      h(
        "contents nya-range-bounds",
        " ",
        new OpLt(false, true).el,
        this.name.el,
        new OpLt(false, true).el,
        " ",
      ),
      this.max.el,
      h(
        "contents nya-range-bounds",
        h("ml-4 font-sans text-sm text-[--nya-range-step]", "Step: "),
        this.step.el,
      ),
      this.scrubber.el,
    )

    this.min.latex`-10`
    this.max.latex`10`
    this.min.ast = this.min.block.ast()
    this.max.ast = this.max.block.ast()
  }

  unlink() {
    this.min.unlink()
    this.max.unlink()
    this.step.unlink()
  }

  relink() {
    this.min.relink()
    this.max.relink()
    this.step.relink()
  }

  setBoundsAppropriately() {
    if (this.min.dirtyValue) {
      this.min.recomputeRaw()
    }
    if (this.max.dirtyValue) {
      this.max.recomputeRaw()
    }
    if (this.step.dirtyValue) {
      this.step.recomputeRaw()
    }

    if (
      this.min.value &&
      this.max.value &&
      typeof this.min.value != "string" &&
      typeof this.max.value != "string"
    ) {
      const nmin = num(this.min.value)
      const nmax = num(this.max.value)

      if (nmin <= nmax) {
        this.scrubber.bounds(this.min.value, this.max.value)
      } else {
        this.min.setError("Bounds must be in order.")
      }
    }
  }
}
