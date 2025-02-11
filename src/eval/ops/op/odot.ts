import type { GlslContext } from "../../lib/fn"
import { pt } from "../../ty/create"
import { FnDist } from "../dist"
import { declareMulR64, mul, mulR64 } from "./mul"

function declareOdotC64(ctx: GlslContext) {
  ctx.glsl`vec4 _helper_odot_c64(vec4 a, vec4 b) {
  return vec4(
    _helper_mul_r64(a.xy, b.xy),
    _helper_mul_r64(a.zw, b.zw)
  );
}
`
}

export const OP_ODOT = new FnDist(
  "⊙",
  "multiples complex numbers or points component-wise",
)
  .add(
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
    ["c64", "c64"],
    "c64",
    (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    (ctx, a, b) => {
      declareMulR64(ctx)
      declareOdotC64(ctx)
      return `_helper_odot_c64(${a.expr}, ${b.expr})`
    },
  )
  .add(
    ["c32", "c32"],
    "c32",
    (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    (_, a, b) => {
      return `(${a.expr} * ${b.expr})`
    },
  )
  .add(
    ["point64", "point64"],
    "point64",
    (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    (ctx, a, b) => {
      declareMulR64(ctx)
      declareOdotC64(ctx)
      return `_helper_odot_c64(${a.expr}, ${b.expr})`
    },
  )
  .add(
    ["point32", "point32"],
    "point32",
    (a, b) => pt(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    (_, a, b) => {
      return `(${a.expr} * ${b.expr})`
    },
  )
