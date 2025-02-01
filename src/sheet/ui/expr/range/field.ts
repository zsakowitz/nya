import type { RangeControls } from "."
import { js } from "../../../../eval/js"
import type { SReal } from "../../../../eval/ty"
import { coerceValJs } from "../../../../eval/ty/coerce"
import { TY_INFO } from "../../../../eval/ty/info"
import type { FieldInert } from "../../../../field/field-inert"
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
    readonly output?: FieldInert,
  ) {
    super(
      controls.expr.sheet.scope,
      "text-[1rem] p-1 pr-2 border-b border-[--nya-border] min-w-12 max-w-24 min-h-[calc(1.5rem_+_1px)] focus:outline-none focus:border-b-[--nya-expr-focus] focus:border-b-2 [&::-webkit-scrollbar]:hidden overflow-x-auto align-middle focus:-mb-px",
    )
    this.leaf = true
  }

  recompute(): void {
    this.el.classList.remove(...RED)

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
      this.value = e instanceof Error ? e.message : String(e)
    }
  }
}
