import type { GlslContext } from "../../fn"
import { FnDist } from "../../fn/dist"
import { approx, num, pt } from "../../ty/create"

function declareSin(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_sin(vec2 z) {
  return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}
`
}

export const FN_SIN = new FnDist("sin")
  .add(
    ["r32"],
    "r32",
    (a) => approx(Math.sin(num(a.value))),
    (_, a) => `sin(${a.expr})`,
  )
  .add(
    ["c32"],
    "c32",
    (a) =>
      pt(
        approx(Math.sin(num(a.value.x)) * Math.cosh(num(a.value.y))),
        approx(Math.cos(num(a.value.x)) * Math.sinh(num(a.value.y))),
      ),
    (ctx, a) => {
      declareSin(ctx)
      return `_helper_sin(${a})`
    },
  )
