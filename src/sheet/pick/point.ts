import type { JsVal } from "../../eval/ty"
import { pt, real } from "../../eval/ty/create"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { drawPoint } from "../ext/exts/01-point"
import { Expr } from "../ui/expr"
import type { Point } from "../ui/paper"
import type { Sheet } from "../ui/sheet"
import { Writer } from "../write"

export function virtualPoint(at: Point, sheet: Sheet) {
  const val: JsVal<"point64"> = {
    type: "point64",
    value: pt(real(at.x), real(at.y)),
  }

  let ref: Block | undefined

  return {
    val,
    ref() {
      if (ref) return ref

      const expr = new Expr(sheet)
      const name = sheet.scope.name("p")
      const cursor = expr.field.block.cursor(R)
      CmdVar.leftOf(cursor, name, expr.field.options)
      new OpEq(false).insertAt(cursor, L)
      const inner = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
      new Writer(inner.cursor(R).span()).set(
        at.x,
        sheet.paper.el.width / sheet.paper.bounds().w,
        false,
      )
      new CmdComma().insertAt(inner.cursor(R), L)
      new Writer(inner.cursor(R).span()).set(
        at.y,
        sheet.paper.el.width / sheet.paper.bounds().w,
        false,
      )
      expr.field.dirtyAst = expr.field.dirtyValue = true
      expr.field.trackNameNow()
      expr.field.scope.queueUpdate()

      const ret = new Block(null)
      CmdVar.leftOf(ret.cursor(R), name, sheet.options)

      return (ref = ret)
    },
    draw() {
      drawPoint(sheet.paper, at, undefined, true)
    },
  }
}
