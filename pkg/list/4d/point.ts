import type { Addon } from "#/types"
import { OP_Z } from "$/3d/point"
import { FN_VALID } from "$/bool"
import {
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_DIV,
  OP_NEG,
  OP_ODOT,
  OP_POINT,
  OP_POS,
  OP_SUB,
} from "$/core/ops"
import { FN_POINT, OP_X, OP_Y } from "$/geo/point"
import { FN_UNSIGN } from "$/num/real"
import { FnDist } from "@/eval/ops/dist"
import { highRes } from "@/eval/ty/info"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"
import { h, path, svgx } from "@/jsx"
import { pt, ptnan, type SPoint } from "@/lib/point"

declare module "@/eval/ty" {
  interface Tys {
    // short for "point 4d; 32 bits"
    p4d32: SPoint<4>
  }
}

const OP_W = new FnDist(".w", "gets the w-coordinate of a point")

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
  load() {
    OP_X.add(
      ["p4d32"],
      "r32",
      (x) => x.value.d[0],
      (_, a) => `${a.expr}.x`,
      "(7,-8,2,5).x=7",
    )

    OP_Y.add(
      ["p4d32"],
      "r32",
      (x) => x.value.d[1],
      (_, a) => `${a.expr}.y`,
      "(7,-8,2,5).y=-8",
    )

    OP_Z.add(
      ["p4d32"],
      "r32",
      (x) => x.value.d[2],
      (_, a) => `${a.expr}.z`,
      "(7,-8,2,5).z=2",
    )

    OP_W.add(
      ["p4d32"],
      "r32",
      (x) => x.value.d[3],
      (_, a) => `${a.expr}.w`,
      "(7,-8,2,5).z=5",
    )

    OP_POINT.add(
      ["r32", "r32", "r32", "r32"],
      "p4d32",
      (x, y, z, w) => pt([x.value, y.value, z.value, w.value]),
      (_, x, y, z, w) => `vec4(${x.expr}, ${y.expr}, ${z.expr}, ${w.expr})`,
      "(7,-8,2)",
    )

    OP_ADD.add(
      ["p4d32", "p4d32"],
      "p4d32",
      (a, b) => a.value.add(b.value),
      (_, a, b) => `(${a.expr} + ${b.expr})`,
      "(7,-9,4,2)+(2,-3,0,-5)=(9,-12,4,-3)",
    )

    OP_SUB.add(
      ["p4d32", "p4d32"],
      "p4d32",
      (a, b) => a.value.sub(b.value),
      (_, a, b) => `(${a.expr} - ${b.expr})`,
      "(7,-9,4,2)-(2,-3,0,-5)=(5,-6,4,7)",
    )

    FN_UNSIGN.add(
      ["p4d32"],
      "p4d32",
      (a) => a.value.unsign(),
      (_, a) => `abs(${a.expr})`,
      "unsign((7,-9,4,-5))=(7,9,4,5)",
    )

    OP_ABS.add(
      ["p4d32"],
      "rabs32",
      (a) => a.value.hypot(),
      (_, a) => `length(${a.expr})`,
      "|(3,-4,12,84)|=85",
    )

    OP_NEG.add(
      ["p4d32"],
      "p4d32",
      (a) => a.value.neg(),
      (_, a) => `(-${a.expr})`,
      "-(3,-4,0,5)=(-3,4,0,-5)",
    )

    FN_VALID.add(
      ["p4d32"],
      "bool",
      (a) => a.value.finite(),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!(any(isnan(${a})) || any(isinf(${a}))))`
      },
      ["valid((2,3,-4,-5))=true", "valid((\\frac00,\\infty,-4,5))=false"],
    )

    OP_ODOT.add(
      ["p4d32", "p4d32"],
      "p4d32",
      (a, b) => a.value.mulEach(b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      "(7,-9,4,5)\\odot(2,-3,0,-5)=(14,27,0,-25)",
    )

    OP_POS.add(
      ["p4d32"],
      "p4d32",
      (a) => a.value,
      (_, a) => a.expr,
      "+(2,-4,7)=(2,-4,7)",
    )

    OP_CDOT.add(
      ["p4d32", "r32"],
      "p4d32",
      (a, b) => a.value.mulR(b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      [],
    ).add(
      ["r32", "p4d32"],
      "p4d32",
      (a, b) => b.value.mulR(a.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      "8\\cdot(9,-4,2,5)=(72,-32,16,40)",
    )

    OP_DIV.add(
      ["p4d32", "r32"],
      "p4d32",
      (a, b) => a.value.divR(b.value),
      (_, a, b) => `(${a.expr} / ${b.expr})`,
      "(72,-32,16,8)÷4=(18,-8,4,2)",
    )

    FN_POINT.add(
      ["p4d32"],
      "p4d32",
      (a) => a.value,
      (_, a) => a.expr,
      "point((7,8,-2,5))=(7,8,-2,5)",
    )
  },
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
  eval: {
    fn: {
      ".x": OP_X,
      ".y": OP_Y,
      ".z": OP_Z,
      ".w": OP_W,
    },
  },
} satisfies Addon
