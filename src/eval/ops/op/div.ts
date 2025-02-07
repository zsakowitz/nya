import type { GlslContext } from "../../lib/fn"
import { safe } from "../../lib/util"
import type { SPoint, SReal } from "../../ty"
import { approx, frac, num, pt } from "../../ty/create"
import { FnDist } from "../dist"
import { add } from "./add"
import { declareMulQ32, mul, mulQ32 } from "./mul"
import { neg } from "./neg"
import { sub } from "./sub"

export function recip(a: SReal): SReal {
  if (a.type == "exact") {
    if (a.d != 0) {
      return frac(a.d, a.n)
    }
  }

  return approx(1 / num(a))
}

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

export const OP_DIV = new FnDist("÷", "divides two values")
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
  .add(
    ["q32", "q32"],
    "q32",
    (a, { value: [r, i, j, k] }) => {
      const hyp = add(mul(r, r), add(mul(i, i), add(mul(j, j), mul(k, k))))
      const ret = mulQ32(a.value, [r, neg(i), neg(j), neg(k)])
      for (let i = 0; i < 3; i++) {
        ret[i] = div(ret[i]!, hyp)
      }
      return ret
    },
    (ctx, a, b) => {
      declareMulQ32(ctx)
      ctx.glsl`vec4 _helper_div_q32(vec4 a, vec4 b) {
  float hyp = b.x * b.x + b.y * b.y + b.z * b.z + b.w * b.w;
  return _helper_mul_q32(a, b * vec4(1, -1, -1, -1)) / hyp;
}
`
      return `_helper_div_q32(${a.expr}, ${b.expr})`
    },
  )
