import type { Package } from "."
import { FnDistVar } from "../eval/ops/dist"
import { declareCmpR64, FN_CMP } from "../eval/ops/fn/cmp"
import { FN_HSV } from "../eval/ops/fn/color/hsv"
import { FN_EXP } from "../eval/ops/fn/exp"
import { FN_UNSIGN } from "../eval/ops/fn/unsign"
import { FN_VALID } from "../eval/ops/fn/valid"
import { abs, abs64, OP_ABS } from "../eval/ops/op/abs"
import { add, addR64, OP_ADD } from "../eval/ops/op/add"
import { OP_CROSS } from "../eval/ops/op/cross"
import { div, OP_DIV } from "../eval/ops/op/div"
import { OP_MOD } from "../eval/ops/op/mod"
import { mul, mulR64, OP_CDOT } from "../eval/ops/op/mul"
import { neg, OP_NEG } from "../eval/ops/op/neg"
import { OP_ODOT } from "../eval/ops/op/odot"
import { OP_PLOT, plotJs } from "../eval/ops/op/plot"
import { OP_POS } from "../eval/ops/op/pos"
import { OP_RAISE, raise } from "../eval/ops/op/raise"
import { OP_SUB, sub, subR64 } from "../eval/ops/op/sub"
import type { SReal } from "../eval/ty"
import { approx, frac, num, real } from "../eval/ty/create"
import { TY_INFO } from "../eval/ty/info"

declare module "../eval/ty/index.js" {
  interface Tys {
    r32: SReal
    r64: SReal
  }

  interface TyComponents {
    r32: never
    r64: never
  }
}

export const FN_MAX = new FnDistVar("max", "returns the maximum of its inputs")
export const FN_MIN = new FnDistVar("min", "returns the minimum of its inputs")

OP_ABS.add(
  ["r64"],
  "r64",
  (a) => abs(a.value),
  (ctx, a) => abs64(ctx, a.expr),
).add(
  ["r32"],
  "r32",
  (a) => abs(a.value),
  (_, a) => `abs(${a.expr})`,
)

OP_ADD.add(
  ["r64", "r64"],
  "r64",
  (a, b) => add(a.value, b.value),
  (ctx, a, b) => addR64(ctx, a.expr, b.expr),
).add(
  ["r32", "r32"],
  "r32",
  (a, b) => add(a.value, b.value),
  (_, a, b) => `(${a.expr} + ${b.expr})`,
)

// TODO: cmp

OP_CROSS.add(
  ["r64", "r64"],
  "r64",
  (a, b) => mul(a.value, b.value),
  (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
).add(
  ["r32", "r32"],
  "r32",
  (a, b) => mul(a.value, b.value),
  (_, a, b) => `(${a.expr} * ${b.expr})`,
)

OP_DIV.add(
  ["r32", "r32"],
  "r32",
  (a, b) => div(a.value, b.value),
  (_, a, b) => `(${a.expr} / ${b.expr})`,
)

OP_MOD.add(
  ["r32", "r32"],
  "r32",
  (ar, br) => {
    const a = num(ar.value)
    const b = num(br.value)
    return approx(((a % b) + b) % b)
  },
  (ctx, a, b) => {
    ctx.glsl`float _helper_mod_r32(float a, float b) {
  return mod(mod(a, b) + b, b);
}
`
    return `_helper_mod_r32(${a.expr}, ${b.expr})`
  },
)

OP_CDOT.add(
  ["r64", "r64"],
  "r64",
  (a, b) => mul(a.value, b.value),
  (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
)
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => mul(a.value, b.value),
    (_, a, b) => `(${a.expr} * ${b.expr})`,
  )
  .add(
    ["color", "bool"],
    "color",
    (a, b) => (b.value ? a.value : TY_INFO.color.garbage.js),
    (_, a, b) => `(${b.expr} ? ${a.expr} : ${TY_INFO.color.garbage.glsl})`,
  )
  .add(
    ["bool", "color"],
    "color",
    (b, a) => (b.value ? a.value : TY_INFO.color.garbage.js),
    (_, b, a) => `(${b.expr} ? ${a.expr} : ${TY_INFO.color.garbage.glsl})`,
  )

OP_NEG.add(
  ["r64"],
  "r64",
  (a) => neg(a.value),
  (_, a) => `(-${a.expr})`,
).add(
  ["r32"],
  "r32",
  (a) => neg(a.value),
  (_, a) => `(-${a.expr})`,
)

OP_ODOT.add(
  ["r64", "r64"],
  "r64",
  (a, b) => mul(a.value, b.value),
  (ctx, a, b) => mulR64(ctx, a.expr, b.expr),
).add(
  ["r32", "r32"],
  "r32",
  (a, b) => mul(a.value, b.value),
  (_, a, b) => `(${a.expr} * ${b.expr})`,
)

OP_PLOT.add(
  ["r32"],
  "color",
  plotJs,
  (ctx, a) =>
    FN_HSV.glsl1(
      ctx,
      a,
      { type: "r32", expr: "1.0" },
      { type: "r32", expr: "1.0" },
    ).expr,
)

OP_POS.add(
  ["r64"],
  "r64",
  (a) => a.value,
  (_, a) => a.expr,
).add(
  ["r32"],
  "r32",
  (a) => a.value,
  (_, a) => a.expr,
)

OP_RAISE.add(
  ["r32", "r32"],
  "r32",
  (a, b) => raise(a.value, b.value),
  (_, a, b) => {
    return `pow(${a.expr}, ${b.expr})`
  },
)

OP_SUB.add(
  ["r64", "r64"],
  "r64",
  (a, b) => sub(a.value, b.value),
  (ctx, a, b) => subR64(ctx, a.expr, b.expr),
).add(
  ["r32", "r32"],
  "r32",
  (a, b) => sub(a.value, b.value),
  (_, a, b) => `(${a.expr} - ${b.expr})`,
)

FN_EXP.add(
  ["r32"],
  "r32",
  (a) => approx(Math.exp(num(a.value))),
  (_, a) => `exp(${a.expr})`,
)

FN_MAX.add(
  ["r32", "r32"],
  "r32",
  (a, b) => (num(b.value) > num(a.value) ? b.value : a.value),
  (_, a, b) => `max(${a.expr}, ${b.expr})`,
)

FN_MIN.add(
  ["r32", "r32"],
  "r32",
  (a, b) => (num(b.value) < num(a.value) ? b.value : a.value),
  (_, a, b) => `min(${a.expr}, ${b.expr})`,
)

FN_UNSIGN.add(
  ["r64"],
  "r64",
  (a) => abs(a.value),
  (ctx, a) => abs64(ctx, a.expr),
).add(
  ["r32"],
  "r32",
  (a) =>
    a.value.type == "approx" ?
      approx(Math.abs(a.value.value))
    : frac(Math.abs(a.value.n), Math.abs(a.value.d)),
  (_, a) => `abs(${a})`,
)

FN_VALID.add(
  ["r32"],
  "bool",
  (a) => isFinite(num(a.value)),
  (ctx, ar) => {
    const a = ctx.cache(ar)
    return `(!isnan(${a}) && !isinf(${a}))`
  },
)

function cmpJs(a: { value: SReal }, b: { value: SReal }) {
  const ar = num(a.value)
  const br = num(b.value)
  return (
    ar < br ? real(-1)
    : ar > br ? real(1)
    : real(0)
  )
}

FN_CMP.add(["r64", "r64"], "r32", cmpJs, (ctx, a, b) => {
  // TODO: NaN probably outputs 0 in r64
  declareCmpR64(ctx)
  return `_helper_cmp_r64(${a.expr}, ${b.expr})`
}).add(["r32", "r32"], "r32", cmpJs, (ctx, a, b) => {
  ctx.glsl`
float _helper_cmp_r32(float a, float b) {
  if (a < b) {
    return -1.0;
  } else if (a > b) {
    return 1.0;
  } else {
    return 0.0;
  }
}
`
  return `_helper_cmp_r32(${a.expr}, ${b.expr})`
})

export const PKG_REAL: Package = {
  id: "nya:num-real",
  name: "real numbers",
  label: "adds support for real numbers",
  eval: {
    fns: {
      exp: FN_EXP,
      max: FN_MAX,
      min: FN_MIN,
      unsign: FN_UNSIGN,
      valid: FN_VALID,
      cmp: FN_CMP,
    },
  },
}
