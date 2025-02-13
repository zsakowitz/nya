import type { Package } from "."
import { glsl } from "../eval/glsl"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../eval/ops/vars"
import { h, hx } from "../jsx"
import { Store, defineExt } from "../sheet/ext"
import type { Expr } from "../sheet/ui/expr"
import { circle } from "../sheet/ui/expr/circle"
import { OP_PLOT, PKG_COLOR_CORE } from "./color-core"
import { PKG_REAL } from "./num-real"

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
    set show(v) {
      setShow(v)
    },
  }

  function setShow(v: boolean) {
    show = v
    circEmpty.classList.toggle("hidden", show)
    circShader.classList.toggle("hidden", !show)
    expr.display()
  }
})

export function show(expr: Expr) {
  store.get(expr).show = true
}

const EXT_GLSL = defineExt({
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

export const PKG_SHADER: Package = {
  id: "nya:shader",
  name: "shaders",
  label: "allows shaders to be created with the x, y, and p variables",
  deps: [() => PKG_COLOR_CORE, () => PKG_REAL],
  eval: {
    vars: {
      x: {
        get js(): never {
          throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
        },
        glsl: { type: "r64", expr: "v_coords.xy", list: false },
        dynamic: true,
      },
      y: {
        get js(): never {
          throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
        },
        glsl: { type: "r64", expr: "v_coords.zw", list: false },
        dynamic: true,
      },
    },
    fns: {
      forceshader: {
        js() {
          throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
        },
        glsl(_, ...args) {
          if (args.length != 1) {
            throw new Error("'forceshader' should be passed a single argument.")
          }
          return args[0]!
        },
      },
    },
  },
  sheet: {
    exts: {
      3: [EXT_GLSL],
    },
  },
}
