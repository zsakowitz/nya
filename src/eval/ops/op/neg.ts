import type { SReal } from "../../ty"
import { approx, frac } from "../../ty/create"
import { FnDist } from "../dist"

export function neg(a: SReal): SReal {
  return a.type == "exact" ? frac(-a.n, a.d) : approx(-a.value)
}

export const OP_NEG = new FnDist("-", "negates its input")
