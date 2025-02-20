import type { Package } from "."
import { glsl } from "../eval/glsl"
import { id } from "../eval/lib/binding"
import type { Fn } from "../eval/ops"
import { docByIcon } from "../eval/ops/dist"
import { ALL_DOCS, type WithDocs } from "../eval/ops/docs"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../eval/ops/vars"
import { coerceValueGlsl } from "../eval/ty/coerce"
import { any } from "../eval/ty/info"
import { h, hx } from "../jsx"
import { Store, defineExt } from "../sheet/ext"
import { circle } from "../sheet/ui/expr/circle"
import { PROP_SHOWN } from "../show"
import { OP_PLOT, PKG_COLOR_CORE } from "./color-core"
import { OP_SUB, declareAddR64 } from "./core-ops"
import { PKG_REAL } from "./num-real"

const store = new Store((expr) => {
  const circEmpty = circle("empty")
  const circShader = circle("shaderon")
  circShader.classList.add("hidden")

  const field = hx("input", { type: "checkbox", class: "sr-only" })
  field.checked = PROP_SHOWN.get(expr)
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
  plotGl(data) {
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

      declareAddR64(props.ctx)

      function go(dx: number, dy: number) {
        const add = (a: string, b: string) => `_helper_add_r64(${a},${b})`
        const X2 = add("v_coords.xy", "u_unit_per_hpx.xy")
        const Y2 = add("v_coords.zw", "u_unit_per_hpx.zw")
        const offset = props.ctx.cachedNative(
          "vec4",
          `vec4(${dx.toExponential()} * u_unit_per_hpx.x, 0, ${dy.toExponential()} * u_unit_per_hpx.z, 0)`,
        )
        props.ctx.push`v_coords += ${offset};\n`
        const a = props.ctx.cached(
          "r32",
          coerceValueGlsl(
            props.ctx,
            OP_SUB.glsl(props.ctx, glsl(lhs, props), glsl(rhs, props)),
            { type: "r32", list: false },
          ),
        )
        const x = props.ctx.cached(
          "r32",
          props.bindings.with(
            id({ value: "x" }),
            { type: "r64", expr: X2, list: false },
            () =>
              coerceValueGlsl(
                props.ctx,
                OP_SUB.glsl(props.ctx, glsl(lhs, props), glsl(rhs, props)),
                { type: "r32", list: false },
              ),
          ),
        )
        const y = props.ctx.cached(
          "r32",
          props.bindings.with(
            id({ value: "y" }),
            { type: "r64", expr: Y2, list: false },
            () =>
              coerceValueGlsl(
                props.ctx,
                OP_SUB.glsl(props.ctx, glsl(lhs, props), glsl(rhs, props)),
                { type: "r32", list: false },
              ),
          ),
        )
        const y2 = props.ctx.cached(
          "r32",
          props.bindings.with(
            id({ value: "x" }),
            { type: "r64", expr: X2, list: false },
            () =>
              props.bindings.with(
                id({ value: "y" }),
                { type: "r64", expr: Y2, list: false },
                () =>
                  coerceValueGlsl(
                    props.ctx,
                    OP_SUB.glsl(props.ctx, glsl(lhs, props), glsl(rhs, props)),
                    { type: "r32", list: false },
                  ),
              ),
          ),
        )
        const isEdge = props.ctx.cached(
          "bool",
          `(abs(sign(${a}) + sign(${x}) + sign(${y})) != 3. || abs(sign(${a}) + sign(${x}) + sign(${y2})) != 3.)`,
        )
        props.ctx.push`v_coords -= ${offset};\n`
        return isEdge
      }

      const results = [-3, -2, -1, 0, 1, 2, 3]
        .flatMap((a) =>
          [-3, -2, -1, 0, 1, 2, 3].map((b) => ({
            a,
            b,
            dist: Math.hypot(a, b),
          })),
        )
        .sort((a, b) => b.dist - a.dist)
        .filter((a) => a.dist < 3)
        .map(({ a, b }) => {
          const result = go(a, b)
          return `${result} ? vec4(0.1764705882, 0.4392156863, 0.7019607843, 1) : `
        })
        .join("")

      return [props.ctx, `${results}vec4(0)`]
    }

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

const forceshader: Fn & WithDocs = {
  js() {
    throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
  },
  glsl(_, ...args) {
    if (args.length != 1) {
      throw new Error("'forceshader' should be passed a single argument.")
    }
    return args[0]!
  },
  docs() {
    return [docByIcon([any()], any())]
  },
  name: "forceshader",
  label: "forces the given expression to be executed in a shader",
}

ALL_DOCS.push(forceshader)

export const PKG_SHADER: Package = {
  id: "nya:shader",
  name: "shaders",
  label: "creates shaders with the x, y, and p variables",
  deps: [() => PKG_COLOR_CORE, () => PKG_REAL],
  eval: {
    vars: {
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
    fns: {
      forceshader,
    },
  },
  sheet: {
    exts: {
      3: [EXT_GLSL],
    },
  },
}
