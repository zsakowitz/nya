import type { GlslContext } from "../../fn"
import { FnDist } from "../../fn/dist"
import type { SPoint, SReal } from "../../ty"
import { approx, frac, num, pt } from "../../ty/create"
import { safe } from "../../util"
import { add } from "./add"
import { mul } from "./mul"
import { sub } from "./sub"

export function div(a: SReal, b: SReal): SReal {
  a: if (a.type == "exact" && b.type == "exact") {
    const s1 = a.n * b.d
    if (!safe(s1)) break a
    const s2 = b.n * a.d
    if (!safe(s2)) break a
    return frac(s1, s2)
  }

  return approx(num(a) / num(b))
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

export const OP_DIV = new FnDist("/")
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => div(a.value, b.value),
    (_, a, b) => `(${a.expr} / ${b.expr})`,
  )
  .add(
    ["c32", "c32"],
    "c32",
    (a, b) => divPt(a.value, b.value),
    (ctx, a, b) => {
      declareDiv(ctx)
      return `_helper_div(${a.expr}, ${b.expr})`
    },
  )
