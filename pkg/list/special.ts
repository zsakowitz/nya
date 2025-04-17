import betaGl from "#/glsl/beta.glsl"
import erfC32Gl from "#/glsl/erf-c32.glsl"
import lngammaGl from "#/glsl/lngamma.glsl"
import zetaGl from "#/glsl/zeta.glsl"
import type { Package } from "#/types"
import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import { approx, num, pt, real, rept, unpt } from "@/eval/ty/create"
import gammaln from "@stdlib/math/base/special/gammaln"
import { complex, zeta } from "mathjs"
import { declareFactorialC32, declareFactorialR32 } from "./factorial"
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

function declareBeta(ctx: GlslContext) {
  declareFactorialR32(ctx)
  ctx.glslText(lngammaGl)
  ctx.glslText(betaGl)
}

const FN_BETA = new FnDist("beta", "beta function").add(
  ["r32", "r32"],
  "r32",
  (ar, br) => {
    const a = num(ar.value)
    const b = num(br.value)
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
    const a = num(ar.value)
    const b = num(br.value)
    const s = (x: number) => (x > 0 || Math.floor(x) % 2 == 0 ? 1 : -1)
    return real(s(a) * s(b) * s(a + b))
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
    const a = num(ar.value)
    const b = num(br.value)
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
  eval: {
    fn: {
      zeta: FN_ZETA,
      faddeeva: FN_FADDEEVA,
      beta: FN_BETA,
      lnbeta: FN_LNBETA,
      signbeta: FN_SIGNBETA,
    },
  },
} satisfies Package
