import type { Package } from "."
import type { GlslContext } from "../eval/lib/fn"
import { FnDist } from "../eval/ops/dist"
import { ERR_COORDS_USED_OUTSIDE_GLSL } from "../eval/ops/vars"
import type { GlslVal, JsVal, SPoint } from "../eval/ty"
import { isZero } from "../eval/ty/check"
import { approx, num, pt, real } from "../eval/ty/create"
import type { TyWrite } from "../eval/ty/display"
import { highRes } from "../eval/ty/info"
import { abs, add, div, mul, neg, sub } from "../eval/ty/ops"
import { h } from "../jsx"
import { FN_VALID } from "./bool"
import { OP_PLOT, plotJs } from "./color-core"
import {
  abs64,
  addR64,
  declareAddR64,
  declareMulC32,
  declareMulR64,
  declareOdotC64,
  declareSubR64,
  OP_ABS,
  OP_ADD,
  OP_CDOT,
  OP_DIV,
  OP_NEG,
  OP_ODOT,
  OP_POS,
  OP_RAISE,
  OP_SUB,
  subR64,
} from "./core-ops"
import { declareDebugPoint, FN_DEBUGPOINT, PKG_GEO_POINT } from "./geo-point"
import {
  FN_EXP,
  FN_LN,
  FN_LOG10,
  FN_SIGN,
  FN_UNSIGN,
  PKG_REAL,
} from "./num-real"

declare module "../eval/ty" {
  interface Tys {
    c32: SPoint
    c64: SPoint
  }

  interface TyComponents {
    c32: "r32"
    c64: "r64"
  }
}

function declareExp(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_exp(vec2 a) {
  return exp(a.x) * vec2(cos(a.y), sin(a.y));
}
`
}

const FN_POINT = new FnDist("point", "converts a complex number into a point")

const FN_ARG = new FnDist(
  "arg",
  "returns the angle between a point and the x-axis",
)

const FN_COMPLEX = new FnDist(
  "complex",
  "converts a point into a complex number",
)

const FN_CONJ = new FnDist(
  "conj",
  "takes the conjugate of a complex number or quaternion",
)

const FN_DOT = new FnDist("dot", "takes the dot product of two complex numbers")

const FN_IMAG = new FnDist(
  "imag",
  "gets the imaginary part of a complex number",
)

const FN_REAL = new FnDist("real", "gets the real part of a complex number")

const WRITE_COMPLEX: TyWrite<SPoint> = {
  isApprox(value) {
    return value.x.type == "approx" || value.y.type == "approx"
  },
  display(value, props) {
    props.nums([
      [value.x, ""],
      [value.y, "i"],
    ])
  },
}

export const PKG_NUM_COMPLEX: Package = {
  id: "nya:num-complex",
  name: "complex numbers",
  label: "basic support for complex numbers",
  init() {
    FN_ARG.add(
      ["c32"],
      "r32",
      ({ value: a }) => approx(Math.atan2(num(a.y), num(a.x))),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `atan(${a}.y, ${a}.x)`
      },
    )

    FN_SIGN.add(
      ["c32"],
      "c32",
      ({ value: a }) => {
        const denom = real(Math.hypot(num(a.x), num(a.y)))
        return pt(div(a.x, denom), div(a.y, denom))
      },
      (_, a) => `normalize(${a.expr})`,
    )

    FN_EXP.add(
      ["c32"],
      "c32",
      ({ value: a }) => {
        const e = approx(Math.exp(num(a.x)))
        const y = num(a.y)

        return pt(mul(e, approx(Math.cos(y))), mul(e, approx(Math.sin(y))))
      },
      (ctx, a) => {
        declareExp(ctx)
        return `_helper_exp(${a.expr})`
      },
    )

    function declareLnC32(ctx: GlslContext) {
      ctx.glsl`vec2 _helper_ln_c32(vec2 z) {
  if (z == vec2(0)) {
    return vec2(-1.0 / 0.0, 0);
  }

  return vec2(log(length(z)), atan(z.y, z.x));
}
`
    }

    FN_LN.add(
      ["c32"],
      "c32",
      ({ value: a }) => {
        if (isZero(a)) {
          return pt(real(-Infinity), real(0))
        }

        const x = num(a.x)
        const y = num(a.y)

        return pt(approx(Math.log(Math.hypot(x, y))), approx(Math.atan2(y, x)))
      },
      (ctx, a) => {
        declareLnC32(ctx)
        return `_helper_ln_c32(${a.expr})`
      },
    )

    FN_LOG10.add(
      ["c32"],
      "c32",
      ({ value: a }) => {
        if (isZero(a)) {
          return pt(real(-Infinity), real(0))
        }

        const x = num(a.x)
        const y = num(a.y)

        return pt(
          approx(Math.log10(Math.hypot(x, y))),
          approx(Math.atan2(y, x) / Math.LN10),
        )
      },
      (ctx, a) => {
        declareLnC32(ctx)
        return `(_helper_ln_c32(${a.expr}) / vec2(log(10.0)))`
      },
    )

    FN_VALID.add(
      ["c32"],
      "bool",
      (a) => isFinite(num(a.value.x)) && isFinite(num(a.value.y)),
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(!isnan(${a}.x) && !isinf(${a}.x) && !isnan(${a}.y) && !isinf(${a}.y))`
      },
    )

    FN_CONJ.add(
      ["c64"],
      "c64",
      (a) => pt(a.value.x, neg(a.value.y)),
      (_, a) => `(${a} * vec4(1, 1, -1, -1))`,
    ).add(
      ["c32"],
      "c32",
      (a) => pt(a.value.x, neg(a.value.y)),
      (_, a) => `(${a} * vec2(1, -1))`,
    )

    FN_DOT.add(
      ["c64", "c64"],
      "r64",
      (a, b) => sub(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      dotC64,
    ).add(
      ["c32", "c32"],
      "r32",
      (a, b) => sub(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      dotC32,
    )

    FN_UNSIGN.add(
      ["c64"],
      "c64",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (ctx, a) => {
        const name = ctx.cache(a)
        return `vec4(${abs64(ctx, `${name}.xy`)}, ${abs64(ctx, `${name}.zw`)})`
      },
    ).add(
      ["c32"],
      "c32",
      (a) => pt(abs(a.value.x), abs(a.value.y)),
      (_, a) => `abs(${a.expr})`,
    )

    FN_IMAG.add(
      ["c64"],
      "r64",
      (a) => a.value.y,
      (_, a) => `${a.expr}.zw`,
    ).add(
      ["c32"],
      "r32",
      (a) => a.value.y,
      (_, a) => `${a.expr}.y`,
    )

    FN_REAL.add(
      ["c64"],
      "r64",
      (a) => a.value.x,
      (_, a) => `${a.expr}.xy`,
    ).add(
      ["c32"],
      "r32",
      (a) => a.value.x,
      (_, a) => `${a.expr}.x`,
    )

    FN_DEBUGPOINT.add(
      ["c32"],
      "color",
      () => {
        throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
      },
      (ctx, a) => declareDebugPoint(ctx, a),
    )

    OP_SUB.add(["c64", "c64"], "c64", subC, (ctx, ar, br) => {
      const a = ctx.cache(ar)
      const b = ctx.cache(br)
      return `vec4(${subR64(ctx, `${a}.xy`, `${b}.xy`)}, ${subR64(ctx, `${a}.zw`, `${b}.zw`)})`
    }).add(["c32", "c32"], "c32", subC, (_, a, b) => `(${a.expr} - ${b.expr})`)

    OP_RAISE.add(
      ["c32", "c32"],
      "c32",
      ({ value: a }, { value: b }) => {
        if (isZero(b)) {
          if (b.x.type == "exact" && b.y.type == "exact") {
            return pt(real(1), real(0))
          } else {
            return pt(approx(1), approx(0))
          }
        }

        if (isZero(a)) {
          if (a.x.type == "exact" && a.y.type == "exact") {
            return pt(real(0), real(0))
          } else {
            return pt(approx(0), approx(0))
          }
        }

        return FN_EXP.js1(
          OP_CDOT.js1(
            { type: "c32", value: b },
            {
              type: "c32",
              value: pt(
                approx(Math.log(Math.hypot(num(a.x), num(a.y)))),
                approx(Math.atan2(num(a.y), num(a.x))),
              ),
            },
          ),
        ).value as SPoint
      },
      (ctx, a, b) => {
        declareMulC32(ctx)
        declareExp(ctx)
        ctx.glsl`vec2 _helper_pow_c32(vec2 a, vec2 b) {
  if (a == vec2(0)) {
    return vec2(0);
  } else {
    vec2 ln_a = vec2(log(length(a)), atan(a.y, a.x));
    return _helper_exp(_helper_mul_c32(b, ln_a));
  }
}
`
        return `_helper_pow_c32(${a.expr}, ${b.expr})`
      },
    )

    OP_ODOT.add(
      ["c64", "c64"],
      "c64",
      (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      (ctx, a, b) => {
        declareMulR64(ctx)
        declareOdotC64(ctx)
        return `_helper_odot_c64(${a.expr}, ${b.expr})`
      },
    ).add(
      ["c32", "c32"],
      "c32",
      (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
      (_, a, b) => {
        return `(${a.expr} * ${b.expr})`
      },
    )

    OP_ADD.add(["c64", "c64"], "c64", addC, (ctx, ar, br) => {
      const a = ctx.cache(ar)
      const b = ctx.cache(br)
      return `vec4(${addR64(ctx, `${a}.xy`, `${b}.xy`)}, ${addR64(ctx, `${a}.zw`, `${b}.zw`)})`
    }).add(["c32", "c32"], "c32", addC, (_, a, b) => `(${a.expr} + ${b.expr})`)

    OP_CDOT.add(["c64", "c64"], "c64", mulC, (ctx, a, b) => {
      declareAddR64(ctx)
      declareSubR64(ctx)
      declareMulR64(ctx)
      ctx.glsl`
vec4 _helper_mul_c64(vec4 a, vec4 b) {
  return vec4(
    _helper_sub_r64(_helper_mul_r64(a.xy, b.xy), _helper_mul_r64(a.zw, b.zw)),
    _helper_add_r64(_helper_mul_r64(a.zw, b.xy), _helper_mul_r64(a.xy, b.zw))
  );
}
`
      return `_helper_mul_c64(${a.expr}, ${b.expr})`
    }).add(["c32", "c32"], "c32", mulC, (ctx, a, b) => {
      declareMulC32(ctx)
      return `_helper_mul_c32(${a.expr}, ${b.expr})`
    })

    FN_COMPLEX.add(
      ["c64"],
      "c64",
      (a) => a.value,
      (_, a) => a.expr,
    )
      .add(
        ["c32"],
        "c32",
        (a) => a.value,
        (_, a) => a.expr,
      )
      .add(
        ["point64"],
        "c64",
        (a) => a.value,
        (_, a) => a.expr,
      )
      .add(
        ["point32"],
        "c32",
        (a) => a.value,
        (_, a) => a.expr,
      )

    FN_POINT.add(
      ["c64"],
      "point64",
      (a) => a.value,
      (_, a) => a.expr,
    )
      .add(
        ["c32"],
        "point32",
        (a) => a.value,
        (_, a) => a.expr,
      )
      .add(
        ["point64"],
        "point64",
        (a) => a.value,
        (_, a) => a.expr,
      )
      .add(
        ["point32"],
        "point32",
        (a) => a.value,
        (_, a) => a.expr,
      )

    OP_ABS.add(
      ["c32"],
      "r32",
      // TODO: this is exact for some values
      (a) => approx(Math.hypot(num(a.value.x), num(a.value.y))),
      (_, a) => `length(${a.expr})`,
    )

    OP_DIV.add(
      ["c32", "c32"],
      "c32",
      (a, b) => divPt(a.value, b.value),
      (ctx, a, b) => {
        declareDiv(ctx)
        return `_helper_div(${a.expr}, ${b.expr})`
      },
    )

    OP_NEG.add(
      ["c64"],
      "c64",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
    ).add(
      ["c32"],
      "c32",
      (a) => pt(neg(a.value.x), neg(a.value.y)),
      (_, a) => `(-${a.expr})`,
    )

    OP_PLOT.add(
      ["c32"],
      "color",
      plotJs,
      (ctx, a) => FN_DEBUGPOINT.glsl1(ctx, a).expr,
    )

    OP_POS.add(
      ["c64"],
      "c64",
      (a) => a.value,
      (_, a) => a.expr,
    ).add(
      ["c32"],
      "c32",
      (a) => a.value,
      (_, a) => a.expr,
    )
  },
  deps: [() => PKG_REAL, () => PKG_GEO_POINT],
  ty: {
    coerce: {
      r32: {
        c32: {
          js(self) {
            return pt(self, real(0))
          },
          glsl(self) {
            return `vec2(${self}, 0)`
          },
        },
      },
      r64: {
        c32: {
          js(self) {
            return pt(self, real(0))
          },
          glsl(self) {
            return `vec2(${self}.x, 0)`
          },
        },
        c64: {
          js(self) {
            return pt(self, real(0))
          },
          glsl(self) {
            return `vec4(${self}, 0, 0)`
          },
        },
      },
      bool: {
        c32: {
          js(self) {
            return self ? pt(real(1), real(0)) : pt(real(NaN), real(NaN))
          },
          glsl(self) {
            return `(${self} ? vec2(1,0) : vec2(0.0/0.0))`
          },
        },
      },
    },
    info: {
      c64: {
        name: "complex number",
        namePlural: "complex numbers",
        glsl: "vec4",
        garbage: { js: pt(real(NaN), real(NaN)), glsl: "vec4(0.0/0.0)" },
        coerce: {
          c32: {
            js(self) {
              return self
            },
            glsl(self) {
              return `${self}.xz`
            },
          },
        },
        write: WRITE_COMPLEX,
        icon() {
          return iconComplex(true)
        },
        components: {
          ty: "r64",
          at: [
            [(x) => x.x, (x) => `${x}.xy`],
            [(x) => x.y, (x) => `${x}.zw`],
          ],
        },
      },
      c32: {
        name: "complex number",
        namePlural: "complex numbers",
        glsl: "vec2",
        garbage: { js: pt(real(NaN), real(NaN)), glsl: "vec2(0.0/0.0)" },
        coerce: {},
        write: WRITE_COMPLEX,
        icon() {
          return iconComplex(false)
        },
        components: {
          ty: "r32",
          at: [
            [(x) => x.x, (x) => `${x}.x`],
            [(x) => x.y, (x) => `${x}.y`],
          ],
        },
      },
    },
  },
  eval: {
    fns: {
      point: FN_POINT,
      arg: FN_ARG,
      complex: FN_COMPLEX,
      conj: FN_CONJ,
      dot: FN_DOT,
      imag: FN_IMAG,
      real: FN_REAL,
    },
    vars: {
      p: {
        label: "coordinates of currently drawn shader pixel",
        get js(): never {
          throw new Error(ERR_COORDS_USED_OUTSIDE_GLSL)
        },
        glsl: { type: "c64", expr: "v_coords", list: false },
        dynamic: true,
        display: false,
      },
      i: {
        label: "unit vector perpendicular to number line; a square root of -1",
        js: { type: "c64", value: pt(real(0), real(1)), list: false },
        glsl: { type: "c64", expr: "vec4(0, 0, 1, 0)", list: false },
        display: false,
      },
    },
  },
}

function dotC64(
  ctx: GlslContext,
  a: GlslVal<"c64" | "point64">,
  b: GlslVal<"c64" | "point64">,
) {
  declareSubR64(ctx)
  declareMulR64(ctx)
  ctx.glsl`vec2 _helper_dot_c64(vec4 a, vec4 b) {
  return _helper_sub_r64(
    _helper_mul_r64(a.xy, b.xy),
    _helper_mul_r64(a.zw, b.zw)
  );
}`
  return `_helper_dot_c64(${a.expr}, ${b.expr})`
}

function dotC32(
  ctx: GlslContext,
  a: GlslVal<"c32" | "point32">,
  b: GlslVal<"c32" | "point32">,
) {
  ctx.glsl`float _helper_dot_c32(vec2 a, vec2 b) {
  return a.x * b.x - a.y * b.y;
}`
  return `_helper_dot_c32(${a.expr}, ${b.expr})`
}

function subC(a: JsVal<"c32" | "c64">, b: JsVal<"c32" | "c64">) {
  return pt(sub(a.value.x, b.value.x), sub(a.value.y, b.value.y))
}

function addC(
  a: JsVal<"c32" | "c64" | "point32" | "point64">,
  b: JsVal<"c32" | "c64" | "point32" | "point64">,
) {
  return pt(add(a.value.x, b.value.x), add(a.value.y, b.value.y))
}

function mulC(
  { value: { x: a, y: b } }: JsVal<"c32" | "c64">,
  { value: { x: c, y: d } }: JsVal<"c32" | "c64">,
) {
  return pt(sub(mul(a, c), mul(b, d)), add(mul(b, c), mul(a, d)))
}

export function declareSin(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_sin(vec2 z) {
  return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}
`
}

export function sinPt(a: SPoint) {
  return pt(
    approx(Math.sin(num(a.x)) * Math.cosh(num(a.y))),
    approx(Math.cos(num(a.x)) * Math.sinh(num(a.y))),
  )
}

export function declareCos(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_cos(vec2 z) {
  return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}
`
}

export function cosPt(a: SPoint): SPoint {
  return pt(
    approx(Math.cos(num(a.x)) * Math.cosh(num(a.y))),
    approx(-Math.sin(num(a.x)) * Math.sinh(num(a.y))),
  )
}

export function divPt({ x: a, y: b }: SPoint, { x: c, y: d }: SPoint): SPoint {
  const x = add(mul(a, c), mul(b, d))
  const y = sub(mul(b, c), mul(a, d))
  const denom = add(mul(c, c), mul(d, d))
  return pt(div(x, denom), div(y, denom))
}

export function declareDiv(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_div(vec2 a, vec2 b) {
  return vec2(
    a.x * b.x + a.y * b.y,
    a.y * b.x - a.x * b.y
  ) / (b.x * b.x + b.y * b.y);
}
`
}

function iconComplex(hd: boolean) {
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
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[120%]",
        "i",
      ),
      hd ? highRes() : null,
    ),
  )
}
