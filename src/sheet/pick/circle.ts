import { unpt } from "../../eval/ty/create"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { drawCircle } from "../ext/exts/01-circle"
import { drawPoint } from "../ext/exts/01-point"
import { Expr } from "../ui/expr"
import type { Selected } from "../ui/sheet"
import { createPicker } from "./00-index"
import { virtualPoint } from "./point"

export const PICK_CIRCLE_P1 = createPicker({
  find(_, at, sheet) {
    const [a] = sheet.select(at, ["point32", "point64"], 1)
    if (a) return { type: "defined" as const, a }

    return { type: "virtual" as const, at }
  },
  draw(_, value, sheet) {
    if (value?.type == "virtual") {
      drawPoint(sheet.paper, value.at, undefined, true)
    }
  },
  select(_, value, sheet) {
    sheet.setPick(
      PICK_CIRCLE_P2,
      value.type == "defined" ? value.a : virtualPoint(value.at, sheet),
    )
  },
  cancel(_) {},
})

const PICK_CIRCLE_P2 = createPicker({
  find(_: Selected<"point32" | "point64">, at, sheet) {
    const [a] = sheet.select(at, ["point32", "point64"], 1)
    if (a) return a
    return virtualPoint(at, sheet)
  },
  draw(p1, p2, sheet) {
    if (p2) {
      const center = unpt(p1.val.value)
      const edge = unpt(p2.val.value)
      const radius = Math.hypot(center.x - edge.x, center.y - edge.y)
      drawCircle(center, radius, sheet.paper)
    }

    p1.draw?.()
    p2?.draw?.()
  },
  select(p1, p2, sheet) {
    const expr = new Expr(sheet)
    const name = sheet.scope.name("l")
    const cursor = expr.field.block.cursor(R)
    CmdVar.leftOf(cursor, name, expr.field.options)
    new OpEq(false).insertAt(cursor, L)
    new CmdVar("c", sheet.options).insertAt(cursor, L)
    new CmdVar("i", sheet.options).insertAt(cursor, L)
    new CmdVar("r", sheet.options).insertAt(cursor, L)
    new CmdVar("c", sheet.options).insertAt(cursor, L)
    new CmdVar("l", sheet.options).insertAt(cursor, L)
    new CmdVar("e", sheet.options).insertAt(cursor, L)
    const inner = new Block(null)
    new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
    {
      const cursor = inner.cursor(R)
      p1.ref().insertAt(cursor, L)
      new CmdComma().insertAt(cursor, L)
      p2.ref().insertAt(cursor, L)
    }

    expr.field.dirtyAst = expr.field.dirtyValue = true
    expr.field.trackNameNow()
    expr.field.scope.queueUpdate()

    sheet.setPick(PICK_CIRCLE_P1, {})
  },
  cancel(_) {},
})
