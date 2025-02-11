import type { GlslContext } from "../../lib/fn"
import { approx, num } from "../../ty/create"
import { FnDist } from "../dist"

export function declareExp(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_exp(vec2 a) {
  return exp(a.x) * vec2(cos(a.y), sin(a.y));
}
`
}

export const FN_EXP = new FnDist("exp", "raises e to some value").add(
  ["r32"],
  "r32",
  (a) => approx(Math.exp(num(a.value))),
  (_, a) => `exp(${a.expr})`,
)
