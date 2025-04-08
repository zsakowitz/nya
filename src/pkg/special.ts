import { FnDist } from "@/eval/ops/dist"
import { approx, num, pt, real } from "@/eval/ty/create"
import gammaGl from "@/glsl/gamma.glsl"
import zetaGl from "@/glsl/zeta.glsl"
import { complex, zeta } from "mathjs"
import type { Package } from "."
import { declareFactorialR32 } from "./factorial"
import { declareDiv, declareMulC32, declarePowC32 } from "./num/complex"

export const FN_ZETA: FnDist = new FnDist(
  "zeta",
  "computes the Riemann zeta function",
).add(
  ["c32"],
  "c32",
  (a) => {
    const val = zeta(complex(num(a.value.x), num(a.value.y)))
    if (typeof val == "number") {
      return pt(approx(val), real(0))
    }
    return pt(approx(val.re), approx(val.im))
  },
  (ctx, a) => {
    declareMulC32(ctx)
    declareDiv(ctx)
    declarePowC32(ctx)
    declareFactorialR32(ctx)
    ctx.glslText(gammaGl)
    ctx.glslText(
      "vec2 powcx(vec2 x, vec2 y) { return _helper_pow_c32(x, y); }\n",
    )
    ctx.glslText(zetaGl)
    return `helper_zeta_c32(${a.expr})`
  },
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
