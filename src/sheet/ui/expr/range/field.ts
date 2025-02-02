import { twMerge } from "tailwind-merge"
import type { RangeControls } from "."
import { js } from "../../../../eval/js"
import type { SReal } from "../../../../eval/ty"
import { coerceValJs } from "../../../../eval/ty/coerce"
import { TY_INFO } from "../../../../eval/ty/info"
import { FieldComputed } from "../../../deps"

const RED = [
  "border-b-2",
  "-mb-px",
  "focus:!border-b-[--nya-range-error]",
  "!border-b-[--nya-range-error]",
]

export class Field extends FieldComputed {
  value: SReal | string | null = null

  constructor(
    readonly controls: RangeControls,
    readonly className?: string,
  ) {
    super(
      controls.expr.sheet.scope,
      twMerge("nya-range-bound", className),
      true,
    )
    this.leaf = true
  }

  recompute(): void {
    this.el.classList.remove(...RED)
    this.controls.el.classList.remove("nya-range-error")

    if (this.ast.type == "void") {
      this.value = null
      return
    }

    try {
      const value = js(this.ast, this.scope.propsJs)
      if (value.list !== false) {
        throw new Error(
          "A list of numbers cannot be a range bound. Try using any number.",
        )
      }
      try {
        var r32 = coerceValJs(value, "r32")
      } catch (e) {
        throw new Error(
          `Cannot use a ${TY_INFO[value.type].name} as a slider bound. Try using any number.`,
        )
      }
      this.value = r32.value
    } catch (e) {
      console.warn("[range bound eval]", e)
      this.el.classList.add(...RED)
      this.controls.el.classList.add("nya-range-error")
      this.value = e instanceof Error ? e.message : String(e)
    }
  }
}
