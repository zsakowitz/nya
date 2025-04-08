import { FnDist } from "@/eval/ops/dist"
import { approx, num, pt, real } from "@/eval/ty/create"
import { complex, zeta } from "mathjs"
import type { Package } from "."

export const FN_ZETA: FnDist = new FnDist(
  "zeta",
  "computes the Riemann zeta function",
).addJs(
  ["c32"],
  "c32",
  (a) => {
    const val = zeta(complex(num(a.value.x), num(a.value.y)))
    if (typeof val == "number") {
      return pt(approx(val), real(0))
    }
    return pt(approx(val.re), approx(val.im))
  },
  "zeta2≈1.645",
)

export const PKG_SPECIAL_FNS: Package = {
  id: "nya:special-fns",
  name: "special functions",
  label: "for uncomputable integrals and sums",
  category: "numbers (multi-dimensional)",
  eval: {
    fn: {
      zeta: FN_ZETA,
    },
  },
}
