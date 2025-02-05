import { defineExt, Store } from ".."
import { glsl } from "../../../eval/glsl"
import { OP_PLOT } from "../../../eval/ops/op/plot"
import { h, hx } from "../../../jsx"
import { circle } from "../../ui/expr/circle"

const store = new Store((expr) => {
  let show = false

  const circEmpty = circle("empty")
  const circShader = circle("shaderon")
  circShader.classList.add("hidden")

  const field = hx("input", { type: "checkbox", class: "sr-only" })
  field.checked = show
  field.addEventListener("input", () => setShow(field.checked))

  const el = hx(
    "label",
    "",
    field,
    h("sr-only", "plot this shader?"),
    circEmpty,
    circShader,
  )

  return {
    el,
    get show() {
      return show
    },
  }

  function setShow(v: boolean) {
    show = v
    circEmpty.classList.toggle("hidden", show)
    circShader.classList.toggle("hidden", !show)
    expr.display()
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
  aside(data) {
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
