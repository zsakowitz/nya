import erfC32Gl from "#/glsl/erf-c32.glsl"
import type { Package } from "#/types"
import { FnDist } from "@/eval/ops/dist"
import { declareMulC32 } from "./num/complex"
import { faddeevaPt } from "./special/erf-complex"

const FN_FADDEEVA = new FnDist("faddeeva", "scaled complex error function").add(
  ["c32"],
  "c32",
  (a) => faddeevaPt(a.value.ns()).s(),
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
  scripts: ["complex/zeta", "complex/beta", "complex/erf"],
  eval: {
    fn: {
      faddeeva: FN_FADDEEVA,
    },
  },
} satisfies Package
