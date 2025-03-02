import type { JsValue, Val } from "../../../eval/ty"
import { OpEq } from "../../../field/cmd/leaf/cmp"
import { CmdToken } from "../../../field/cmd/leaf/token"
import { CmdVar } from "../../../field/cmd/leaf/var"
import { Block, L, R } from "../../../field/model"
import type { Ctx } from "../../../sheet/deps"
import type { Expr } from "../../../sheet/ui/expr"
import type { PickProps } from "../../../sheet/ui/paper/interact"

export function pick(
  val: Val,
  data: { value: JsValue; expr: Expr },
  ctx: Ctx,
): Omit<PickProps, "draw" | "drawFocus"> {
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
          data.expr.field.ctx,
        )
        return block
      }

      const name = CmdToken.new(ctx)
      const c = data.expr.field.block.cursor(L)
      name.insertAt(c, L)
      new OpEq(false).insertAt(c, L)
      const block = new Block(null)
      name.clone().insertAt(block.cursor(R), L)
      data.expr.field.dirtyAst = data.expr.field.dirtyValue = true
      data.expr.field.trackNameNow()
      data.expr.field.scope.queueUpdate()

      return block
    },
    focus() {
      requestAnimationFrame(() => data.expr.focus())
    },
  }
}
