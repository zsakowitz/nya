import { safe } from "../../lib/util"
import type { SReal } from "../../ty"
import { isZero } from "../../ty/check"
import { frac, num, real } from "../../ty/create"
import { FnDist } from "../dist"

export function raise(a: SReal, b: SReal): SReal {
  if (isZero(b)) {
    return real(1)
  }

  if (isZero(a)) {
    return real(0)
  }

  if (a.type == "exact") {
    const n = a.n ** num(b)
    const d = a.d ** num(b)
    if (safe(n) && safe(d)) return frac(n, d)
    return real(n / d)
  }

  // TODO: things like (-8) ** (1/3) don't work
  // TODO: use approx and exact better
  return real(num(a) ** num(b))
}

export const OP_RAISE = new FnDist("^", "raises a value to an exponent")
