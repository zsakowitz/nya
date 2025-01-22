import type { GlslContext } from "../../../fn"
import { FnDist } from "../../dist"
import type { SPoint } from "../../../ty"
import { approx, num, pt } from "../../../ty/create"

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
    (a) => sinPt(a.value),
    (ctx, a) => {
      declareSin(ctx)
      return `_helper_sin(${a})`
    },
  )
