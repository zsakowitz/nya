import type { Package } from "#/types"
import { example } from "@/docs/core"
import { js } from "@/eval/ast/tx"
import { jsToGlsl } from "@/eval/js-to-glsl"
import type { Fn } from "@/eval/ops"
import { ALL_DOCS, type WithDocs } from "@/eval/ops/docs"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "@/eval/ops/vars"
import { TY_INFO } from "@/eval/ty/info"
import { b, h, hx, li, p, px } from "@/jsx"
import { Prop, Store, defineExt } from "@/sheet/ext"
import { circle } from "@/sheet/ui/expr/circle"

const PROP_SHOWN = new Prop(() => true)

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
  // FIXME: we are ignoring all glsl-related things
  // glsl(): undefined {
  //   // if (!data.show) return
  //   //     const props = data.expr.sheet.scope.propsGlsl()
  //   //     let ast = data.expr.field.ast
  //   //     if (
  //   //       ast.type == "cmplist" &&
  //   //       ast.ops.length == 1 &&
  //   //       ast.ops[0]! == "cmp-eq"
  //   //     ) {
  //   //       const lhs = ast.items[0]!
  //   //       const rhs = ast.items[1]!
  //   //       return createLine(
  //   //         data.expr.sheet.cv,
  //   //         props,
  //   //         () => glsl(lhs, props),
  //   //         () => glsl(rhs, props),
  //   //       )
  //   //     }
  //   //
  //   //     if (ast.type == "binding") {
  //   //       ast = ast.value
  //   //     }
  //   //
  //   //     const fork = props.ctx.fork()
  //   //     const value = glsl(ast, { ...props, ctx: fork })
  //   //     if (canCoerce(value.type, "r32")) {
  //   //       const deps = data.expr.field.allDeps()
  //   //       const usesX = deps.has(id({ value: "x" }))
  //   //       const usesY = deps.has(id({ value: "y" }))
  //   //       const usesP = deps.has(id({ value: "p" }))
  //   //       if (usesX && !usesY && !usesP) {
  //   //         return createLine(
  //   //           data.expr.sheet.cv,
  //   //           props,
  //   //           () => ({ type: "r64", expr: "v_coords.zw", list: false }),
  //   //           () => {
  //   //             props.ctx.push`${fork.block}`
  //   //             return value
  //   //           },
  //   //         )
  //   //       }
  //   //     }
  //   //
  //   //     props.ctx.push`${fork.block}`
  //   //     const color = OP_PLOT.glsl(props.ctx, [value])
  //   //     if (color.list !== false) {
  //   //       throw new Error("Shaders must return a single color.")
  //   //     }
  //   //     return [props.ctx, color.expr]
  // },
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

export default {
  name: "shaders",
  label: "creates shaders with the x, y, and p variables",
  category: "miscellaneous",
  deps: ["color/core", "num/real"],
  eval: {
    tx: {
      magic: {
        // TODO: evaluate as much at js time as possible, even w/o forcejs
        forcejs: {
          label:
            "evaluates an expression outside a shader, then passes the value to the shader",
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
    {
      name: "domain coloring",
      poster: "p^6-1",
      render() {
        return [
          px`Domain coloring is a method of visualizing functions which map complex numbers to complex numbers. Here are some such functions:`,
          example("f(z)=z^6-1", null),
          example("f(z)=\\frac1zsinz^3", null),
          px`In domain coloring, each pixel on the plane is assigned a color based on the value of the function at that point. For instance, the pixel at ${b("(2,3)")} is assigned a color based on ${b("f(2+3i)")}.`,
          px`The color is assigned by two attributes of the function's value:`,
          hx(
            "ul",
            "list-disc pl-6 *:first:mb-4",
            li`The magnitude of the value (how far it is from 0) is turned into the grayscale brightness of the color. Values close to zero are darker, and values far from zero are whiter.`,
            li`The argument of the value (its angle relative to the x-axis) is turned into the hue of the color. Positive real values are ${h("text-white px-1 rounded-xs bg-[#027D42]", "green")}, positive imaginary values are ${h("text-white px-1 rounded-xs bg-[#0064BB]", "blue")}, negative real values are ${h("text-white px-1 rounded-xs bg-[#9C347E]", "magenta")}, and negative imaginary values are ${h("text-white px-1 rounded-xs bg-[#9A4C01]", "orange")}.`,
          ),
          px`Domain coloring is automatically activated if you write any expression which references x, y, or p.`,
        ]
      },
    },
  ],
} satisfies Package
