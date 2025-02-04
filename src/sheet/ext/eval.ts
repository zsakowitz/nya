import { defineExt, Store } from "."
import { js } from "../../eval/js"
import { id } from "../../eval/lib/binding"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../../eval/ops/vars"
import { Display, outputBase } from "../../eval/ty/display"
import { FieldInert } from "../../field/field-inert"
import { R } from "../../field/model"

const ID_X = id({ value: "x" })
const ID_Y = id({ value: "y" })
const ID_P = id({ value: "p" })

const store = new Store((e) => new FieldInert(e.field.options))

export const EXT_EVAL = defineExt({
  id: "eval",
  getState(expr) {
    if (
      expr.field.deps.isBound(ID_X) ||
      expr.field.deps.isBound(ID_Y) ||
      expr.field.deps.isBound(ID_P)
    ) {
      return
    }

    try {
      let ast = expr.field.ast
      if (ast.type == "binding") {
        ast = ast.value
      }

      const value = js(ast, expr.field.scope.propsJs)
      const base = outputBase(ast, expr.field.scope.propsJs)
      const { block } = store.get(expr)
      block.clear()
      new Display(block.cursor(R), base).output(value)
    } catch (e) {
      if (!(e instanceof Error && e.message == ERR_COORDS_USED_OUTSIDE_GLSL)) {
        throw e
      }
    }
  },
  el(props) {
    return store.get(props.expr).el
  },
})
