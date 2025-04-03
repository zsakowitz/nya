import type { Node } from "@/eval/ast/token"
import { NO_SYM } from "@/eval/ast/tx"
import { js } from "@/eval/js"
import { id } from "@/eval/lib/binding"
import { issue } from "@/eval/ops/issue"
import { each, type JsValue, type Val } from "@/eval/ty"
import { canCoerce, coerceTyJs } from "@/eval/ty/coerce"
import { approx, num, real } from "@/eval/ty/create"
import { CmdWord } from "@/field/cmd/leaf/word"
import { L } from "@/field/model"
import { h, path, svgx } from "@/jsx"
import { defineHideable } from "@/sheet/ext/hideable"
import { norm } from "@/sheet/point"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import type { Expr } from "@/sheet/ui/expr"
import type { Package } from "."
import { gridlineCoords } from "./gridlines"

declare module "@/eval/ty" {
  interface Tys {
    slopefield: Node
  }
}

const glsl = issue("Cannot use slope fields in shaders.")

const EXT_SLOPE_FIELD = defineHideable<
  {
    expr: Expr
    value: JsValue<"slopefield">
  },
  Val<"slopefield">
>({
  data(expr) {
    if (expr.js?.value.type == "slopefield") {
      return { expr, value: expr.js.value as JsValue<"slopefield"> }
    }
  },
  plot: {
    items(data) {
      return each(data.value)
    },
    order() {
      return Order.Graph
    },
    draw(data, node) {
      const kind =
        data.expr.sheet.cv.width > 1600 || data.expr.sheet.cv.height > 1600 ?
          "major"
        : "minor"
      const sx = gridlineCoords(data.expr.sheet.cv, "x", kind)
      const sy = gridlineCoords(data.expr.sheet.cv, "y", kind)
      const path = new Path2D()
      const size =
        Size.SlopeFieldMarker *
        data.expr.sheet.cv.scale *
        (kind == "major" ? 4 : 1)

      for (const x of sx) {
        for (const y of sy) {
          const props = data.expr.sheet.scope.propsJs
          const value = props.bindingsJs.withAll(
            {
              [id({ value: "x" })]: {
                type: "r64",
                list: false,
                value: approx(x),
              },
              [id({ value: "y" })]: {
                type: "r64",
                list: false,
                value: approx(y),
              },
            },
            () => js(node, props),
          )
          const isR32 = canCoerce(value.type, "r32")
          if (!isR32) {
            throw new Error(
              "The function in 'slopefield' must return a number.",
            ) // FIXME: or vector
          }

          const r32 = coerceTyJs(value, "r32")
          const at = data.expr.sheet.cv.toCanvas({ x, y })
          for (const slopeRaw of each(r32)) {
            const slope = num(slopeRaw)
            if (isNaN(slope)) continue
            const { x: dx, y: dy } =
              slope == Infinity || slope == -Infinity ?
                { x: 0, y: size }
              : norm({ x: 1, y: -slope }, size)
            path.moveTo(at.x - dx / 2, at.y - dy / 2)
            path.lineTo(at.x + dx / 2, at.y + dy / 2)
          }
        }
      }

      data.expr.sheet.cv.path(path, Size.Line, Color.Blue, Opacity.SlopeField)
    },
  },
})

export const PKG_SLOPE_FIELD: Package = {
  id: "nya:slope-field",
  name: "slope fields",
  label: null,
  category: "miscellaneous",
  ty: {
    info: {
      slopefield: {
        name: "slope field",
        namePlural: "slope fields",
        get glsl(): never {
          return glsl()
        },
        toGlsl: glsl,
        garbage: {
          js: {
            type: "value",
            value: { type: "r64", list: false, value: real(NaN) },
          },
          get glsl(): never {
            return glsl()
          },
        },
        coerce: {},
        write: {
          isApprox() {
            return false
          },
          display(_, props) {
            new CmdWord("slopefield", "var").insertAt(props.cursor, L)
          },
        },
        order: Order.Graph,
        point: false,
        icon() {
          const S2 = Math.SQRT2
          const S8 = Math.sqrt(8)
          return h(
            "",
            h(
              "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              svgx(
                "0 0 16 16",
                "size-[16px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible [stroke-linecap:round] stroke-current stroke-2",
                path(
                  `M ${2 - S2} ${2 - S2} l ${S8} ${S8} M 6 2 h 4 M ${14 - S2} ${2 - S2} l ${S8} ${S8} M ${2 - S2} ${8 - S2} l ${S8} ${S8} M 8 6 v 4 M ${14 - S2} ${8 - S2} l ${S8} ${S8} M ${2 - S2} ${14 - S2} l ${S8} ${S8} M 6 14 h 4 M ${14 - S2} ${14 - S2} l ${S8} ${S8}`,
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview(cv, val) {
          // FIXME: previewing a slope field should display it
        },
        extras: null,
      },
    },
  },
  eval: {
    tx: {
      magic: {
        slopefield: {
          fnlike: true,
          deps(node, deps) {
            deps.add(node.contents)
          },
          js(node) {
            if (node.sub) {
              throw new Error("Cannot attach a subscript to 'slopefield'.")
            }
            if (node.sup) {
              throw new Error(
                "Superscripts on 'slopefield' are not supported yet.",
              )
            }
            if (node.prop) {
              throw new Error(
                "Cannot access a property of the 'slopefield' function.",
              )
            }
            return { type: "slopefield", list: false, value: node.contents }
          },
          sym: NO_SYM,
          glsl,
        },
      },
    },
  },
  sheet: {
    exts: { 1: [EXT_SLOPE_FIELD] },
  },
}
