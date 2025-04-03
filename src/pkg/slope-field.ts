import type { Node } from "@/eval/ast/token"
import { issue } from "@/eval/ops/issue"
import { real } from "@/eval/ty/create"
import { CmdWord } from "@/field/cmd/leaf/word"
import { L } from "@/field/model"
import { h, path, svgx } from "@/jsx"
import { Order } from "@/sheet/ui/cv/consts"
import type { Package } from "."

declare module "@/eval/ty" {
  interface Tys {
    slopefield: Node
  }
}

const glsl = issue("Cannot use slope fields in shaders.")

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
}
