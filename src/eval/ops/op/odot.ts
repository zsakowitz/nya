import type { GlslContext } from "../../lib/fn"
import { FnDist } from "../dist"
import { mul, mulR64 } from "./mul"

export function declareOdotC64(ctx: GlslContext) {
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
