import type { Package } from "#/types"
import { gridlineCoords } from "$/gridlines" // imported but not strictly necessary
import type { Node } from "@/eval/ast/token"
import { js, NO_SYM } from "@/eval/ast/tx"
import { id } from "@/eval/lib/binding"
import { issue } from "@/eval/ops/issue"
import { each, type JsValue, type Val } from "@/eval/ty"
import { canCoerce, coerceTyJs } from "@/eval/ty/coerce"
import { approx, num, real } from "@/eval/ty/create"
import { CmdWord } from "@/field/cmd/leaf/word"
import { L } from "@/field/dir"
import { h, hx, path, svgx } from "@/jsx"
import { Store } from "@/sheet/ext"
import { defineHideable } from "@/sheet/ext/hideable"
import { norm } from "@/sheet/point"
import { Color, Opacity, Order, Size } from "@/sheet/ui/cv/consts"
import type { Expr } from "@/sheet/ui/expr"
import { vectorPath } from "./geo/dcg/util-vector"

declare module "@/eval/ty" {
  interface Tys {
    slopefield: Node
  }
}

const glsl = issue("Cannot use slope fields in shaders.")

const cv = new Store(() => {
  const el = hx("canvas")
  try {
    return el.transferControlToOffscreen().getContext("2d")!
  } catch {
    return el.getContext("2d")!
  }
})

const EXT_SLOPE_FIELD = defineHideable<
  {
    expr: Expr
    value: JsValue<"slopefield">
    offscreen: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
  },
  Val<"slopefield">
>({
  data(expr) {
    if (expr.js?.value.type == "slopefield") {
      return {
        expr,
        value: expr.js.value as JsValue<"slopefield">,
        offscreen: cv.get(expr),
      }
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
      const cv = data.expr.sheet.cv
      if (!cv.width || !cv.height || !cv.scale) return
      const kind = cv.width > 3200 || cv.height > 3200 ? "major" : "minor"
      const sx = gridlineCoords(cv, "x", kind, 2)
      const sy = gridlineCoords(cv, "y", kind, 2)
      const path = new Path2D()
      const size =
        Size.SlopeFieldMarker * cv.scale * (kind == "major" ? 8 : 1.5)

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
          if (isR32) {
            const r32 = coerceTyJs(value, "r32")
            const at = cv.toCanvas({ x, y })
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

          const isVector = canCoerce(value.type, "vector")
          if (isVector) {
            const r32 = coerceTyJs(value, "vector")
            for (const vectorRaw of each(r32)) {
              const dxRaw = num(vectorRaw[1].x) - num(vectorRaw[0].x)
              const dyRaw = num(vectorRaw[1].y) - num(vectorRaw[0].y)
              if (isNaN(dxRaw) || isNaN(dyRaw)) continue
              const { x: dx, y: dy } = cv.toPaperDelta(
                norm({ x: dxRaw, y: -dyRaw }, size),
              )
              const vPath = vectorPath(
                cv,
                { x: x - dx / 4, y: y - dy / 4 },
                { x: x + dx / 4, y: y + dy / 4 },
                Size.SlopeFieldVectorHead,
              )
              path.addPath(new Path2D(vPath))
            }
          }

          const isPoint = canCoerce(value.type, "point32")
          if (isPoint) {
            const r32 = coerceTyJs(value, "point32")
            for (const raw of each(r32)) {
              const dxRaw = num(raw.x)
              const dyRaw = num(raw.y)
              if (isNaN(dxRaw) || isNaN(dyRaw)) continue
              const { x: dx, y: dy } = cv.toPaperDelta(
                norm({ x: dxRaw, y: -dyRaw }, size),
              )
              const vPath = vectorPath(
                cv,
                { x: x - dx / 4, y: y - dy / 4 },
                { x: x + dx / 4, y: y + dy / 4 },
                Size.SlopeFieldVectorHead,
              )
              path.addPath(new Path2D(vPath))
            }
          }
        }
      }

      const temp = data.offscreen
      temp.canvas.width = cv.width * cv.scale
      temp.canvas.height = cv.height * cv.scale
      const self = { ctx: temp, scale: cv.scale }
      cv.path.call(self, path, Size.Line, Color.Blue, 1, 1)
      cv.path.call(self, path, Size.Line, Color.Blue, 1, 1)
      cv.ctx.globalAlpha = Opacity.SlopeField
      cv.ctx.drawImage(temp.canvas, 0, 0)
      cv.ctx.globalAlpha = 1
    },
  },
})

export default {
  name: "slope fields",
  label: "draw fields of slopes or vectors",
  category: "miscellaneous",
  deps: ["geo/dcg", "geo/point", "num/real"],
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
        preview: null,
        extras: null,
      },
    },
  },
  eval: {
    tx: {
      magic: {
        slopefield: {
          label: "generates a slope or vector field",
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
} satisfies Package
