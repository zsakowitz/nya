import erfC32Gl from "#/glsl/erf-c32.glsl"
import zetaGl from "#/glsl/zeta.glsl"
import type { Package } from "#/types"
import { FnDist } from "@/eval/ops/dist"
import { approx, num, pt, real, rept, unpt } from "@/eval/ty/create"
import { complex, zeta } from "mathjs"
import { declareFactorialC32 } from "./factorial"
import { declareDiv, declareMulC32, declarePowC32 } from "./num/complex"
import { faddeevaPt } from "./special/erf-complex"

const FN_ZETA: FnDist = new FnDist("zeta", "computes the Riemann zeta function")
  .addJs(["r32"], "r32", (a) => approx(zeta(num(a.value))), "zeta2≈1.645")
  .add(
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
      declarePowC32(ctx)
      declareDiv(ctx)
      declareFactorialC32(ctx)
      ctx.glslText(zetaGl)
      return `zeta(${a.expr})`
    },
    "zeta(2+3i)≈0.798-0.114i",
  )

const FN_FADDEEVA = new FnDist("faddeeva", "scaled complex error function").add(
  ["c32"],
  "c32",
  (a) => rept(faddeevaPt(unpt(a.value))),
  (ctx, a) => {
    declareMulC32(ctx)
    ctx.glslText(erfC32Gl)
    return `_nya_faddeeva(${a.expr})`
  },
  "faddeeva(2+3i)≈0.130+0.081i",
)

export default {
  name: "special functions",
  label: "for uncomputable integrals and sums",
  category: "numbers (multi-dimensional)",
  deps: [
    "num/complex",
    "num/real",
    "special/erf",
    "special/erf-complex",
    "factorial",
    "gamma",
  ],
  eval: {
    fn: {
      zeta: FN_ZETA,
      faddeeva: FN_FADDEEVA,
    },
  },
} satisfies Package
