import script from "!/4d/point.nya"
import type { Addon } from "#/types"
import { highRes } from "@/eval/ty/info"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"
import { h, path, svgx } from "@/jsx"
import { ptnan, type SPoint } from "@/lib/point"

declare module "@/eval/ty" {
  interface Tys {
    // short for "point 4d; 32 bits"
    p4d32: SPoint<4>
  }
}

function iconPoint4D(hd: boolean) {
  return h(
    "",
    h(
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
      ),
      h(
        "size-[7px] bg-current absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -ml-[2px] -translate-y-1/2 mt-px",
      ),
      svgx(
        "-8 -8 16 16",
        "stroke-current stroke-2 absolute top-1/2 left-1/2 size-[16px] -translate-x-1/2 -translate-y-1/2 overflow-visible [stroke-linecap:round] -ml-[2px] mt-[1px]",
        path("M 0 0 v -8 M 0 0 h 8 M 0 0 l 6 5"),
      ),
      hd ? highRes() : null,
    ),
  )
}

export default {
  name: "4D points",
  label: "for when you need to pack four numbers into a single value",
  category: "geometry",
  deps: ["bool", "geo/point", "core/ops", "num/real"],
  scripts: [script],
  ty: {
    info: {
      p4d32: {
        name: "4D point",
        namePlural: "4D points",
        glsl: "vec4",
        toGlsl(val) {
          return val.gl32()
        },
        garbage: {
          js: ptnan(4),
          glsl: `vec4(0.0/0.0)`,
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.isApprox()
          },
          display(value, props) {
            const block = new Block(null)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
            const inner = props.at(block.cursor(R))
            inner.num(value.d[0])
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(value.d[1])
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(value.d[2])
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(value.d[3])
          },
        },
        order: null,
        point: false,
        icon() {
          return iconPoint4D(false)
        },
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
    },
  },
} satisfies Addon
