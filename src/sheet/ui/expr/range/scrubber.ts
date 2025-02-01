import type { Expr } from ".."
import type { Node } from "../../../../eval/ast/token"
import { parseNumberJs } from "../../../../eval/lib/base"
import { mul } from "../../../../eval/ops/op/mul"
import { neg } from "../../../../eval/ops/op/neg"
import { raise } from "../../../../eval/ops/op/raise"
import type { SReal } from "../../../../eval/ty"
import { frac, num, real } from "../../../../eval/ty/create"
import { Display } from "../../../../eval/ty/display"
import { OpEq } from "../../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../../field/cmd/leaf/var"
import { CmdSupSub } from "../../../../field/cmd/math/supsub"
import { Block, L, R } from "../../../../field/model"
import { Slider } from "../../../slider"

export class ExprScrubber extends Slider {
  constructor(
    readonly expr: Expr,
    className?: string,
  ) {
    super(className)
  }

  onInput(): void {
    if (this.expr.state.type != "range") return

    const { field } = this.expr
    this.expr.field.onBeforeChange()
    field.block.clear()
    const cursor = field.block.cursor(R)
    CmdVar.leftOf(cursor, this.expr.state.name, field.options)
    new OpEq(false).insertAt(cursor, L)
    const base = this.expr.state.base
    this.display(cursor, base || frac(10, 1))
    if (base) {
      const sub = new Block(null)
      new CmdSupSub(sub, null).insertAt(cursor, L)
      new Display(sub.cursor(R), frac(10, 1)).value(num(base))
    }
    this.expr.state.value = this.value
    this.expr.field.sel = cursor.selection()
    this.expr.field.onAfterChange(false)
  }
}

function totallyPlainNum(node: Node, base: SReal): SReal | null {
  let isNeg = false
  if (node.type == "op" && !node.b && node.kind == "-") {
    isNeg = true
    node = node.a
  }

  if (node.type == "num" && !node.sub) {
    const { value } = parseNumberJs(node.value, base)
    return isNeg ? neg(value) : value
  }

  return null
}

function readPlainNum(
  node: Node,
  base: SReal | null,
): { value: SReal; base: SReal | null } | null {
  let isNeg = false
  if (node.type == "op" && !node.b && node.kind == "-") {
    isNeg = true
    node = node.a
  }

  if (!base && node.type == "num" && node.sub) {
    const base = totallyPlainNum(node.sub, real(10))
    if (base == null) return null
    const value = totallyPlainNum({ type: "num", value: node.value }, base)
    if (value == null) return null
    return { value: isNeg ? neg(value) : value, base }
  }

  const baseRaw = base
  base ||= real(10)

  let value
  if (
    node.type == "op" &&
    (node.kind == "\\cdot " || node.kind == "\\times ") &&
    node.b.type == "raise" &&
    node.b.base.type == "num" &&
    !node.b.base.sub &&
    node.b.base.value == "10"
  ) {
    const a = totallyPlainNum(node.a, base)
    if (a == null) return null
    const b = totallyPlainNum(node.b.exponent, base)
    if (b == null) return null
    value = mul(a, raise(base, b))
  } else {
    value = totallyPlainNum(node, base)
  }
  if (value == null) return null

  return { value: isNeg ? neg(value) : value, base: baseRaw }
}

export function readSlider(
  node: Node,
): { value: SReal; base: SReal | null } | null {
  if (
    node.type == "op" &&
    node.kind == "base" &&
    node.b.type == "num" &&
    !node.b.sub &&
    node.b.value.indexOf(".") == -1
  ) {
    const base = +node.b.value
    if (!(2 <= base && base <= 36)) return null
    const value = readPlainNum(node.a, real(base))
    if (value == null) return null
    return { value: value.value, base: real(base) }
  } else {
    const value = readPlainNum(node, null)
    if (value == null) return null
    return value
  }
}
