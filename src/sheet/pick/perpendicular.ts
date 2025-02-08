import { perpendicularJs } from "../../eval/ops/fn/geo/perpendicular"
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { drawLine } from "../ext/exts/01-line"
import { Expr } from "../ui/expr"
import type { Selected } from "../ui/sheet"
import { createPicker } from "./00-index"
import { virtualPoint } from "./point"

export const PICK_PERPENDICULAR_P1 = createPicker({
  find(_, at, sheet) {
    const [a] = sheet.select(at, ["line"], 1)
    if (a) return a
    return null
  },
  draw() {},
  select(_, value, sheet) {
    sheet.setPick(PICK_PERPENDICULAR_P2, value)
  },
  cancel(_) {},
})

const PICK_PERPENDICULAR_P2 = createPicker({
  find(_: Selected<"line">, at, sheet) {
    const [a] = sheet.select(at, ["point32", "point64"], 1)
    if (a) return a
    return virtualPoint(at, sheet)
  },
  draw(p1, p2, sheet) {
    if (p2) {
      const line = perpendicularJs(p1.val, p2?.val)
      drawLine(line, sheet.paper)
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
    for (const c of "perpendicular") {
      new CmdVar(c, sheet.options).insertAt(cursor, L)
    }
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

    sheet.setPick(PICK_PERPENDICULAR_P1, {})
  },
  cancel(_) {},
})
