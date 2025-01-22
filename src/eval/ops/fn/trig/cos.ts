import type { GlslContext } from "../../../fn"
import { FnDist } from "../../dist"
import type { SPoint } from "../../../ty"
import { approx, num, pt } from "../../../ty/create"

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

export const FN_COS = new FnDist("cos")
  .add(
    ["r32"],
    "r32",
    (a) => approx(Math.cos(num(a.value))),
    (_, a) => `cos(${a.expr})`,
  )
  .add(
    ["c32"],
    "c32",
    (a) => cosPt(a.value),
    (ctx, a) => {
      declareCos(ctx)
      return `_helper_cos(${a})`
    },
  )
