import { defineExt, Store } from "."
import { js } from "../../eval/js"
import { id } from "../../eval/lib/binding"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../../eval/ops/vars"
import { Display, outputBase } from "../../eval/ty/display"
import { FieldInert } from "../../field/field-inert"
import { R } from "../../field/model"
import { h } from "../../jsx"

const ID_X = id({ value: "x" })
const ID_Y = id({ value: "y" })
const ID_P = id({ value: "p" })

const store = new Store((e) => {
  const field = new FieldInert(
    e.field.options,
    "bg-[--nya-bg-sidebar] border border-[--nya-border] px-2 py-1 rounded",
  )
  const el = h(
    "flex px-2 pb-2 -mt-2 w-[calc(var(--nya-sidebar)_-_2.5rem_-_1px)] overflow-x-auto [&::-webkit-scrollbar]:hidden justify-end",
    field.el,
  )
  return { field, el }
})

export const EXT_EVAL = defineExt({
  id: "eval",
  data(expr) {
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
      const block = store.get(expr).field.block
      block.clear()
      new Display(block.cursor(R), base).output(value)
      return 0
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
