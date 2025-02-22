import type { JsValue, Val } from "../../../eval/ty"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { Block, L, R } from "../../../field/model"
import type { Expr } from "../../../sheet/ui/expr"

export function pick(
  val: Val,
  abbr: "l" | "c" | "v",
  data: { value: JsValue; expr: Expr },
) {
  return {
    val() {
      return { type: data.value.type, value: val }
    },
    ref() {
      if (data.expr.field.ast.type == "binding") {
        const block = new Block(null)
        CmdVar.leftOf(
          block.cursor(R),
          data.expr.field.ast.name,
          data.expr.field.options,
        )
        return block
      }

      const name = data.expr.sheet.scope.name(abbr)
      const c = data.expr.field.block.cursor(L)
      CmdVar.leftOf(c, name, data.expr.field.options)
      new OpEq(false).insertAt(c, L)
      const block = new Block(null)
      CmdVar.leftOf(block.cursor(R), name, data.expr.field.options)
      data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
      data.expr.field.trackNameNow()
      data.expr.field.scope.queueUpdate()

      return block
    },
  }
}
