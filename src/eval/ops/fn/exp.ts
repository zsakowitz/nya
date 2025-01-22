import type { GlslContext } from "../../fn"
import { FnDist } from "../dist"
import { approx, num, pt } from "../../ty/create"
import { mul } from "../op/mul"

export function declareExp(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_exp(vec2 a) {
  return exp(a.x) * vec2(cos(a.y), sin(a.y));
}
`
}

export const FN_EXP = new FnDist("exp")
  .add(
    ["r32"],
    "r32",
    (a) => approx(Math.exp(num(a.value))),
    (_, a) => `exp(${a.expr})`,
  )
  .add(
    ["c32"],
    "c32",
    ({ value: a }) => {
      const e = approx(Math.exp(num(a.x)))
      const y = num(a.y)

      return pt(mul(e, approx(Math.cos(y))), mul(e, approx(Math.sin(y))))
    },
    (_, a) => `_helper_exp(${a.expr})`,
  )
