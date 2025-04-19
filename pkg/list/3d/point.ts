import type { Package } from "#/types"
import { FN_VALID } from "$/bool"
import {
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_CROSS,
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
    // short for "point 3d; 32 bits"
    p3d32: SPoint<3>
  }
}

export const OP_Z = new FnDist(".z", "gets the z-coordinate of a point")

function iconPoint3D(hd: boolean) {
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
  name: "3D points",
  label:
    "enables cross-products and basic arithmetic on three-dimensional points",
  category: "geometry",
  deps: ["bool", "geo/point", "core/ops", "num/real"],
  load() {
    OP_X.add(
      ["p3d32"],
      "r32",
      (x) => x.value.d[0],
      (_, a) => `${a.expr}.x`,
      "(7,-8,2).x=7",
    )

    OP_Y.add(
      ["p3d32"],
      "r32",
      (x) => x.value.d[1],
      (_, a) => `${a.expr}.y`,
      "(7,-8,2).y=-8",
    )

    OP_Z.add(
      ["p3d32"],
      "r32",
      (x) => x.value.d[2],
      (_, a) => `${a.expr}.z`,
      "(7,-8,2).z=2",
    )

    OP_POINT.add(
      ["r32", "r32", "r32"],
      "p3d32",
      (x, y, z) => pt([x.value, y.value, z.value]),
      (_, x, y, z) => `vec3(${x.expr}, ${y.expr}, ${z.expr})`,
      "(7,-8,2)",
    )

    OP_ADD.add(
      ["p3d32", "p3d32"],
      "p3d32",
      (a, b) => a.value.add(b.value),
      (_, a, b) => `(${a.expr} + ${b.expr})`,
      "(7,-9,4)+(2,-3,0)=(9,-12,4)",
    )

    OP_SUB.add(
      ["p3d32", "p3d32"],
      "p3d32",
      (a, b) => a.value.sub(b.value),
      (_, a, b) => `(${a.expr} - ${b.expr})`,
      "(7,-9,4)-(2,-3,0)=(5,-6,4)",
    )

    FN_UNSIGN.add(
      ["p3d32"],
      "p3d32",
      (a) => a.value.unsign(),
      (_, a) => `abs(${a.expr})`,
      "unsign((7,-9,4))=(7,9,4)",
    )

    OP_ABS.add(
      ["p3d32"],
      "rabs32",
      (a) => a.value.hypot(),
      (_, a) => `length(${a.expr})`,
      "|(3,-4,12)|=13",
    )

    OP_NEG.add(
      ["p3d32"],
      "p3d32",
      (a) => a.value.neg(),
      (_, a) => `(-${a.expr})`,
      "-(3,-4,0)=(-3,4,0)",
    )

    FN_VALID.add(
      ["p3d32"],
      "bool",
      (a) => a.value.finite(),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!(any(isnan(${a})) || any(isinf(${a}))))`
      },
      ["valid((2,3,-4))=true", "valid((\\frac00,\\infty,-4))=false"],
    )

    OP_ODOT.add(
      ["p3d32", "p3d32"],
      "p3d32",
      (a, b) => a.value.mulEach(b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      "(7,-9,4)\\odot(2,-3,0)=(14,27,0)",
    )

    OP_POS.add(
      ["p3d32"],
      "p3d32",
      (a) => a.value,
      (_, a) => a.expr,
      "+(2,-4,7)=(2,-4,7)",
    )

    OP_CDOT.add(
      ["p3d32", "r32"],
      "p3d32",
      (a, b) => a.value.mulR(b.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      [],
    ).add(
      ["r32", "p3d32"],
      "p3d32",
      (a, b) => b.value.mulR(a.value),
      (_, a, b) => `(${a.expr} * ${b.expr})`,
      "8\\cdot(9,-4,2)=(72,-32,16)",
    )

    OP_DIV.add(
      ["p3d32", "r32"],
      "p3d32",
      (a, b) => a.value.divR(b.value),
      (_, a, b) => `(${a.expr} / ${b.expr})`,
      "(72,-32,16)÷4=(18,-8,4)",
    )

    FN_POINT.add(
      ["p3d32"],
      "p3d32",
      (a) => a.value,
      (_, a) => a.expr,
      "point((7,8,-2))=(7,8,-2)",
    )

    OP_CROSS.add(
      ["p3d32", "p3d32"],
      "p3d32",
      (
        {
          value: {
            d: [a1, a2, a3],
          },
        },
        {
          value: {
            d: [b1, b2, b3],
          },
        },
      ) =>
        pt([
          a2.mul(b3).sub(a3.mul(b2)),
          a3.mul(b1).sub(a1.mul(b3)),
          a1.mul(b2).sub(a2.mul(b1)),
        ]),
      (_, a, b) => `cross(${a.expr}, ${b.expr})`,
      ["(2,-4,5)\\times(7,2,-3)=(2,41,32)"],
    )
  },
  ty: {
    info: {
      p3d32: {
        name: "3D point",
        namePlural: "3D points",
        glsl: "vec3",
        toGlsl(val) {
          return val.gl32()
        },
        garbage: {
          js: ptnan(3),
          glsl: `vec3(0.0/0.0)`,
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
          },
        },
        order: null,
        point: false,
        icon() {
          return iconPoint3D(false)
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
    },
  },
} satisfies Package
