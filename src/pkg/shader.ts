import { glsl, jsToGlsl } from "@/eval/glsl"
import { js } from "@/eval/js"
import type { Fn } from "@/eval/ops"
import { ALL_DOCS, type WithDocs } from "@/eval/ops/docs"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "@/eval/ops/vars"
import { TY_INFO } from "@/eval/ty/info"
import { h, hx, p } from "@/jsx"
import { Store, defineExt } from "@/sheet/ext"
import { createLine } from "@/sheet/shader-line"
import { circle } from "@/sheet/ui/expr/circle"
import { PROP_SHOWN } from "@/show"
import type { Package } from "."
import { OP_PLOT, PKG_COLOR_CORE } from "./color/core"
import { PKG_REAL } from "./num/real"

const store = new Store((expr) => {
  const circEmpty = circle("empty")
  const circShader = circle("shaderon")

  const field = hx("input", {
    type: "checkbox",
    class: "sr-only",
    autocomplete: "off",
  })
  field.checked = PROP_SHOWN.get(expr)
  circShader.classList.toggle("hidden", !PROP_SHOWN.get(expr))
  circEmpty.classList.toggle("hidden", PROP_SHOWN.get(expr))
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
      return PROP_SHOWN.get(expr)
    },
    set show(v) {
      setShow(v)
    },
  }

  function setShow(v: boolean) {
    PROP_SHOWN.set(expr, v)
    circEmpty.classList.toggle("hidden", v)
    circShader.classList.toggle("hidden", !v)
    expr.display()
  }
})

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
  glsl(data) {
    if (!data.show) return

    let ast = data.expr.field.ast
    if (
      ast.type == "cmplist" &&
      ast.ops.length == 1 &&
      ast.ops[0]! == "cmp-eq"
    ) {
      const props = data.expr.sheet.scope.propsGlsl()

      const lhs = ast.items[0]!
      const rhs = ast.items[1]!
      return createLine(
        data.expr.sheet.cv,
        props,
        () => glsl(lhs, props),
        () => glsl(rhs, props),
      )
    }

    if (ast.type == "binding") {
      ast = ast.value
    }

    const props = data.expr.sheet.scope.propsGlsl()
    const value = OP_PLOT.glsl(props.ctx, [glsl(ast, props)])
    if (value.list !== false) {
      throw new Error("Shaders must return a single color.")
    }
    return [props.ctx, value.expr]
  },
})

const forceshader: Fn & WithDocs = {
  js() {
    throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
  },
  glsl(_, args) {
    if (args.length != 1) {
      throw new Error("'forceshader' should be passed a single argument.")
    }
    return args[0]!
  },
  docs() {
    return [
      {
        params: [{ type: "__any", list: false }],
        dots: false,
        ret: { type: "__any", list: false },
        usage: "forceshader(2^3)=8",
      },
    ]
  },
  name: "forceshader",
  label: "forces the given expression to be executed in a shader",
}

ALL_DOCS.push(forceshader)

export const PKG_SHADER: Package = {
  id: "nya:shader",
  name: "shaders",
  label: "creates shaders with the x, y, and p variables",
  category: "miscellaneous",
  deps: [() => PKG_COLOR_CORE, () => PKG_REAL],
  eval: {
    tx: {
      magic: {
        forcejs: {
          fnlike: true,
          deps(node, deps) {
            deps.add(node.contents)
          },
          js(node, props) {
            return js(node.contents, props)
          },
          glsl(node, props) {
            return jsToGlsl(js(node.contents, props), props.ctx)
          },
          sym() {
            throw new Error("Cannot call 'forcejs' in a symbolic expression.")
          },
        },
      },
    },
    var: {
      x: {
        label: "x-coordinate of currently drawn shader pixel",
        get js(): never {
          throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
        },
        glsl: { type: "r64", expr: "v_coords.xy", list: false },
        dynamic: true,
        display: false,
      },
      y: {
        label: "y-coordinate of currently drawn shader pixel",
        get js(): never {
          throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
        },
        glsl: { type: "r64", expr: "v_coords.zw", list: false },
        dynamic: true,
        display: false,
      },
    },
    fn: {
      forceshader,
    },
  },
  sheet: {
    exts: {
      3: [EXT_GLSL],
    },
  },
  docs: [
    {
      name: "shaders",
      poster: "rgb(0,x,y)",
      render() {
        return [
          p(
            "If you reference the 'x', 'y', or 'p' variables in an expression, it becomes a ",
            hx("em", "", "shader"),
            ". A shader outputs a single color for every pixel on your screen, and can draw very complex shapes very quickly.",
          ),
          p(
            "When running in shaders, most computations run at a lower precision than normal, since most devices can't handle higher precision values, which might lead to shaders appearing pixelated.",
          ),
          p(
            "Some functions and operators, however, can run on high-precision variants. These operations can be up to 20x slower, but are much more accurate. Note that only these types have high-precision variants:",
          ),
          h(
            "flex flex-col",
            ...Object.entries(TY_INFO)
              .filter((x) => x[0].endsWith("64"))
              .map(([, info]) =>
                h("flex gap-1", info?.icon(), info.name + " (high-res)"),
              ),
          ),
        ]
      },
    },
  ],
}
