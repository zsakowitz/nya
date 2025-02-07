import { createPicker } from "."
import { OpEq } from "../../field/cmd/leaf/cmp"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdVar } from "../../field/cmd/leaf/var"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { drawPoint } from "../ext/exts/01-point"
import { Expr } from "../ui/expr"
import { Writer } from "../write"

export const PICK_POINT = createPicker({
  find(_, at, sheet) {
    const [a] = sheet.select(at, ["point32", "point64"], 1)
    if (a) return { type: "defined" as const, a }

    return { type: "virtual" as const, at }
  },
  draw(_, value, sheet) {
    if (value.type == "virtual") {
      drawPoint(sheet.paper, value.at, undefined, true)
    }
  },
  select(_, value, sheet) {
    if (value.type == "virtual") {
      const expr = new Expr(sheet)
      const name = sheet.scope.name("p")
      const cursor = expr.field.block.cursor(R)
      CmdVar.leftOf(cursor, name, expr.field.options)
      new OpEq(false).insertAt(cursor, L)
      const inner = new Block(null)
      new CmdBrack("(", ")", null, inner).insertAt(cursor, L)
      new Writer(inner.cursor(R).span()).set(
        value.at.x,
        sheet.paper.el.width / sheet.paper.bounds().w,
        false,
      )
      new CmdComma().insertAt(inner.cursor(R), L)
      new Writer(inner.cursor(R).span()).set(
        value.at.y,
        sheet.paper.el.width / sheet.paper.bounds().w,
        false,
      )
      expr.field.dirtyAst = expr.field.dirtyValue = true
      expr.field.scope.queueUpdate()
    } else {
      value.a.ref()
    }
  },
  cancel(_) {},
})
