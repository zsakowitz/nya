import { defineExt, Store } from ".."
import { glsl } from "../../../eval/glsl"
import { OP_PLOT } from "../../../eval/ops/op/plot"
import { hx } from "../../../jsx"

const store = new Store((expr) => {
  let show = false
  const field = hx("input", { type: "checkbox" })
  field.checked = show
  field.onchange = () => {
    show = field.checked
    expr.display()
  }
  const el = hx("label", "", "show?", field)
  return {
    el,
    get show() {
      return show
    },
  }
})

export const EXT_GLSL = defineExt({
  data(expr) {
    const data = store.get(expr)

    return {
      expr,
      el: data.el,
      get show() {
        return data.show
      },
    }
  },
  el(data) {
    return data.el
  },
  plotGl(data) {
    if (!data.show) return

    let ast = data.expr.field.ast
    if (ast.type == "binding") {
      ast = ast.value
    }

    const props = data.expr.sheet.scope.propsGlsl()
    const value = OP_PLOT.glsl(props.ctx, glsl(ast, props))
    if (value.list !== false) {
      throw new Error("Shaders must return a single color.")
    }
    return [props.ctx, value.expr]
  },
})
