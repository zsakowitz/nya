import betaGl from "#/glsl/beta.glsl"
import erfC32Gl from "#/glsl/erf-c32.glsl"
import lngammaGl from "#/glsl/lngamma.glsl"
import type { Package } from "#/types"
import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import { approx, int } from "@/lib/real"
import gammaln from "@stdlib/math/base/special/gammaln"
import { declareFactorialR32 } from "./factorial"
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

function declareBeta(ctx: GlslContext) {
  declareFactorialR32(ctx)
  ctx.glslText(lngammaGl)
  ctx.glslText(betaGl)
}

const FN_BETA = new FnDist("beta", "beta function").add(
  ["r32", "r32"],
  "r32",
  (ar, br) => {
    const a = ar.value.num()
    const b = br.value.num()
    const ln = gammaln(a) + gammaln(b) - gammaln(a + b)
    const s = (x: number) => (x > 0 || Math.floor(x) % 2 == 0 ? 1 : -1)
    const sign = s(a) * s(b) * s(a + b)
    return approx(Math.exp(ln) * sign)
  },
  (ctx, a, b) => {
    declareBeta(ctx)
    return `beta(${a.expr}, ${b.expr})`
  },
  ["beta(2,3)=\\frac{1}{12}", "beta(3.6,-4.1)≈0.381"],
)

const FN_SIGNBETA = new FnDist("signbeta", "sign of the beta function").add(
  ["r32", "r32"],
  "r32",
  (ar, br) => {
    const a = ar.value.num()
    const b = br.value.num()
    const s = (x: number) => (x > 0 || Math.floor(x) % 2 == 0 ? 1 : -1)
    return int(s(a) * s(b) * s(a + b))
  },
  (ctx, a, b) => {
    declareBeta(ctx)
    return `beta_sign(${a.expr}, ${b.expr})`
  },
  ["signbeta(2,3)=1", "signbeta(3.6,-4.1)≈-1"],
)

const FN_LNBETA = new FnDist(
  "lnbeta",
  "natural logarithm of the absolute value of the beta function",
).add(
  ["r32", "r32"],
  "r32",
  (ar, br) => {
    const a = ar.value.num()
    const b = br.value.num()
    return approx(gammaln(a) + gammaln(b) - gammaln(a + b))
  },
  (ctx, a, b) => {
    declareBeta(ctx)
    return `beta_ln(${a.expr}, ${b.expr})`
  },
  ["lnbeta(3.6,-4.1)≈-0.963"],
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
  scripts: ["complex/zeta"],
  eval: {
    fn: {
      faddeeva: FN_FADDEEVA,
      beta: FN_BETA,
      lnbeta: FN_LNBETA,
      signbeta: FN_SIGNBETA,
    },
  },
} satisfies Package
