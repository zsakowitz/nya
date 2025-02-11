import { safe } from "../../lib/util"
import type { SReal } from "../../ty"
import { approx, frac, num } from "../../ty/create"
import { FnDist } from "../dist"

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

export const OP_DIV = new FnDist("÷", "divides two values").add(
  ["r32", "r32"],
  "r32",
  (a, b) => div(a.value, b.value),
  (_, a, b) => `(${a.expr} / ${b.expr})`,
)
