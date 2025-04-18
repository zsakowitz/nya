import type { Package } from "#/types"
import {
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_DIV,
  OP_NEG,
  OP_ODOT,
  OP_POS,
  OP_SUB,
} from "$/core/ops"
import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { SReal, Tys } from "@/eval/ty"
import { approx, gl, num, real } from "@/eval/ty/create"
import { TY_INFO } from "@/eval/ty/info"
import { abs, add, div, mul, neg, sub } from "@/eval/ty/ops"
import { h } from "@/jsx"
import { FN_CONJ, FN_I, FN_REAL } from "./complex"
import { FN_UNSIGN } from "./real"

declare module "@/eval/ty" {
  interface Tys {
    q32: [SReal, SReal, SReal, SReal]
  }
}

const FN_J = new FnDist(".j", "gets the coefficient of 'j' in a quaternion")

const FN_K = new FnDist(".k", "gets the coefficient of 'k' in a quaternion")

function mulQ32(
  [a, b, c, d]: Tys["q32"],
  [e, f, g, h]: Tys["q32"],
): Tys["q32"] {
  //  (a+bi+cj+dk)(e+fi+gj+hk)
  //
  //   ae+afi+agj+ahk
  // + bie+bifi+bigj+bihk
  // + cje+cjfi+cjgj+cjhk
  // + dke+dkfi+dkgj+dkhk
  //
  //   ae+afi+agj+ahk
  // + bie-bf+bgk-bhj
  // + cje-cfk-cg+chi
  // + dke+dfj-dgi-dh
  //
  //   1(ae-bf-cg-dh)
  // + i(af+be+ch-dg)
  // + j(ag-bh+ce+df)
  // + k(ah+bg-cf+de)

  return [
    sub(sub(sub(mul(a, e), mul(b, f)), mul(c, g)), mul(d, h)),
    sub(add(add(mul(a, f), mul(b, e)), mul(c, h)), mul(d, g)),
    add(add(sub(mul(a, g), mul(b, h)), mul(c, e)), mul(d, f)),
    add(sub(add(mul(a, h), mul(b, g)), mul(c, f)), mul(d, e)),
  ]
}

function declareMulQ32(ctx: GlslContext) {
  //   (a+bi+cj+dk)(e+fi+gj+hk)
  //
  //   1(ae-bf-cg-dh)
  // + i(af+be+ch-dg)
  // + j(ag-bh+ce+df)
  // + k(ah+bg-cf+de)
  ctx.glsl`vec4 _helper_mul_q32(vec4 x, vec4 y) {
  float a = x.x;
  float b = x.y;
  float c = x.z;
  float d = x.w;
  float e = y.x;
  float f = y.y;
  float g = y.z;
  float h = y.w;

  return vec4(
    a*e - b*f - c*g - d*h,
    a*f + b*e + c*h - d*g,
    a*g - b*h + c*e + d*f,
    a*h + b*g - c*f + d*e
  );
}
`
}

export default {
  name: "quaternions",
  label: "rudimentary support for quaternions",
  category: "numbers (multi-dimensional)",
  deps: ["num/real", "num/complex"],
  load() {
    OP_POS.add(
      ["q32"],
      "q32",
      (a) => a.value,
      (_, a) => a.expr,
      "+(3-2k)=3-2k",
    )

    OP_NEG.add(
      ["q32"],
      "q32",
      (a) => a.value.map(neg) satisfies SReal[] as any,
      (_, a) => `(-${a.expr})`,
      "-(3+2k)=-3-2k",
    )

    OP_ABS.add(
      ["q32"],
      "rabs32",
      // TODO: this is exact for some values
      (a) =>
        approx(
          Math.hypot(
            num(a.value[0]),
            num(a.value[1]),
            num(a.value[2]),
            num(a.value[3]),
          ),
        ),
      (_, a) => `length(${a.expr})`,
      "|3j+4k|=5",
    )

    OP_ADD.add(
      ["q32", "q32"],
      "q32",
      (a, b) => [
        add(a.value[0], b.value[0]),
        add(a.value[1], b.value[1]),
        add(a.value[2], b.value[2]),
        add(a.value[3], b.value[3]),
      ],
      (_, a, b) => `(${a.expr} + ${b.expr})`,
      "(2+3j)+(4j+k)=2+7j+k",
    )

    OP_SUB.add(
      ["q32", "q32"],
      "q32",
      (a, b) => [
        sub(a.value[0], b.value[0]),
        sub(a.value[1], b.value[1]),
        sub(a.value[2], b.value[2]),
        sub(a.value[3], b.value[3]),
      ],
      (_, a, b) => `(${a.expr} - ${b.expr})`,
      "(2+3j)-(4j+k)=2-j+k",
    )

    OP_ODOT.add(
      ["q32", "q32"],
      "q32",
      (a, b) => [
        mul(a.value[0], b.value[0]),
        mul(a.value[1], b.value[1]),
        mul(a.value[2], b.value[2]),
        mul(a.value[3], b.value[3]),
      ],
      (_, a, b) => {
        return `(${a.expr} * ${b.expr})`
      },
      "(2+3j)\\odot(1+4j+k)=2+12j",
    )

    OP_CDOT.add(
      ["q32", "q32"],
      "q32",
      (a, b) => mulQ32(a.value, b.value),
      (ctx, a, b) => {
        declareMulQ32(ctx)
        return `_helper_mul_q32(${a.expr}, ${b.expr})`
      },
      "(2+3j)\\cdot(1+4j+k)=-10+3i+11j+2k",
    )

    OP_DIV.add(
      ["q32", "q32"],
      "q32",
      (a, { value: [r, i, j, k] }) => {
        const hyp = add(mul(r, r), add(mul(i, i), add(mul(j, j), mul(k, k))))
        const ret = mulQ32(a.value, [r, neg(i), neg(j), neg(k)])
        for (let i = 0; i < 4; i++) {
          ret[i] = div(ret[i]!, hyp)
        }
        return ret
      },
      (ctx, a, b) => {
        declareMulQ32(ctx)
        ctx.glsl`vec4 _helper_div_q32(vec4 a, vec4 b) {
  float hyp = b.x * b.x + b.y * b.y + b.z * b.z + b.w * b.w;
  return _helper_mul_q32(a, b * vec4(1, -1, -1, -1)) / hyp;
}
`
        return `_helper_div_q32(${a.expr}, ${b.expr})`
      },
      "\\frac{2+3j}{4+3i}=0.32-0.24i+0.48j+0.36k",
    )

    FN_UNSIGN.add(
      ["q32"],
      "q32",
      (a) => [
        abs(a.value[0]),
        abs(a.value[1]),
        abs(a.value[2]),
        abs(a.value[3]),
      ],
      (_, a) => `abs(${a.expr})`,
      "unsign(-2-3i+4k)=2+3i+4k",
    )

    FN_CONJ.add(
      ["q32"],
      "q32",
      (a) => [a.value[0], neg(a.value[1]), neg(a.value[2]), neg(a.value[3])],
      (_, a) => `(${a.expr} * vec4(1, -1, -1, -1))`,
      "conj(-2-3i+4k)=2+3i-4k",
    )

    FN_REAL.add(
      ["q32"],
      "r32",
      (a) => a.value[0],
      (_, a) => `${a.expr}.x`,
      "real(-2-3i+4k)=-2",
    )

    FN_I.add(
      ["q32"],
      "r32",
      (a) => a.value[1],
      (_, a) => `${a.expr}.y`,
      "(-2-3i+4k).i=-3",
    )

    FN_J.add(
      ["q32"],
      "r32",
      (a) => a.value[2],
      (_, a) => `${a.expr}.z`,
      "(-2-3i+4k).j=0",
    )

    FN_K.add(
      ["q32"],
      "r32",
      (a) => a.value[3],
      (_, a) => `${a.expr}.w`,
      "(-2-3i+4k).k=4",
    )
  },
  ty: {
    info: {
      q32: {
        name: "quaternion",
        namePlural: "quaternions",
        glsl: "vec4",
        toGlsl(val) {
          return `vec4(${val.map(gl).join(", ")})`
        },
        garbage: {
          js: [real(NaN), real(NaN), real(NaN), real(NaN)],
          glsl: "vec4(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return (
              value[0].type == "approx" ||
              value[1].type == "approx" ||
              value[2].type == "approx" ||
              value[3].type == "approx"
            )
          },
          display(value, props) {
            props.nums([
              [value[0], ""],
              [value[1], "i"],
              [value[2], "j"],
              [value[3], "k"],
            ])
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[oklch(0.518_0.253_323.949)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[100%]",
                "ijk",
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
    coerce: {
      bool: {
        q32: {
          js(self) {
            return self ?
                [real(1), real(0), real(0), real(0)]
              : TY_INFO.q32.garbage.js
          },
          glsl(self) {
            return `(${self} ? vec4(1, 0, 0, 0) : vec4(0.0/0.0))`
          },
        },
      },
      r32: {
        q32: {
          js(self) {
            return [self, real(0), real(0), real(0)]
          },
          glsl(self) {
            return `vec4(${self}, 0, 0, 0)`
          },
        },
      },
      r64: {
        q32: {
          js(self) {
            return [self, real(0), real(0), real(0)]
          },
          glsl(self) {
            return `vec4(${self}.x, 0, 0, 0)`
          },
        },
      },
      c32: {
        q32: {
          js(self) {
            return [self.x, self.y, real(0), real(0)]
          },
          glsl(self) {
            return `vec4(${self}, 0, 0)`
          },
        },
      },
      c64: {
        q32: {
          js(self) {
            return [self.x, self.y, real(0), real(0)]
          },
          glsl(self) {
            return `vec4(${self}.xz, 0, 0)`
          },
        },
      },
    },
  },

  eval: {
    var: {
      j: {
        label: "a four-dimensional unit vector perpendicular to 1, i, and k",
        js: {
          type: "q32",
          value: [real(0), real(0), real(1), real(0)],
          list: false,
        },
        glsl: { type: "q32", expr: "vec4(0, 0, 1, 0)", list: false },
        display: false,
      },
      k: {
        label: "a four-dimensional unit vector perpendicular to 1, i, and j",
        js: {
          type: "q32",
          value: [real(0), real(0), real(0), real(1)],
          list: false,
        },
        glsl: { type: "q32", expr: "vec4(0, 0, 0, 1)", list: false },
        display: false,
      },
    },
    fn: {
      "unsign": FN_UNSIGN,
      "conj": FN_CONJ,
      "real": FN_REAL,
      ".i": FN_I,
      ".j": FN_J,
      ".k": FN_K,
    },
  },
} satisfies Package
