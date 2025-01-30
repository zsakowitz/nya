import type { Expr } from "."
import type { Node } from "../../../eval/ast/token"
import { parseNumberJs } from "../../../eval/lib/base"
import { mul } from "../../../eval/ops/op/mul"
import { neg } from "../../../eval/ops/op/neg"
import { exp10 } from "../../../eval/ops/op/raise"
import type { SReal } from "../../../eval/ty"
import { frac, num } from "../../../eval/ty/create"
import { Display } from "../../../eval/ty/display"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { L, R } from "../../../field/model"
import { Slider } from "../../slider"

export class ExprSlider extends Slider {
  constructor(
    readonly expr: Expr,
    className?: string,
  ) {
    super(className)
  }

  onInput(): void {
    if (this.expr.state.type != "slider") return

    const { field } = this.expr
    this.expr.field.onBeforeChange()
    field.block.clear()
    const cursor = field.block.cursor(R)
    CmdVar.leftOf(cursor, this.expr.state.name, field.options)
    new OpEq(false).insertAt(cursor, L)
    new Display(cursor, frac(10, 1)).value(num(this.value))
    this.expr.field.onAfterChange(false)
  }
}

function totallyPlainNum(node: Node): SReal | null {
  let isNeg = false
  if (node.type == "op" && !node.b && node.kind == "-") {
    isNeg = true
    node = node.a
  }

  if (node.type == "num" && !node.sub) {
    const { value } = parseNumberJs(node.value, frac(10, 1))
    return isNeg ? neg(value) : value
  }

  return null
}

export function plainNum(node: Node): SReal | null {
  let isNeg = false
  if (node.type == "op" && !node.b && node.kind == "-") {
    isNeg = true
    node = node.a
  }

  let value
  if (
    node.type == "op" &&
    (node.kind == "\\cdot " || node.kind == "\\times ") &&
    node.b.type == "raise" &&
    node.b.base.type == "num" &&
    !node.b.base.sub &&
    node.b.base.value == "10"
  ) {
    const a = totallyPlainNum(node.a)
    if (a == null) return null
    const b = totallyPlainNum(node.b.exponent)
    if (b == null) return null
    value = mul(a, exp10(b))
  } else {
    value = totallyPlainNum(node)
  }

  return value && isNeg ? neg(value) : value
}
