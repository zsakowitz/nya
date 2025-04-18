import lngammaGl from "#/glsl/lngamma.glsl"
import type { Package } from "#/types"
import { chain, OP_JUXTAPOSE } from "$/core/ops"
import { Precedence } from "@/eval/ast/token"
import { FnDist } from "@/eval/ops/dist"
import { txr, unary } from "@/eval/sym"
import { approx, num, real, rept } from "@/eval/ty/create"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdBrack } from "@/field/cmd/math/brack"
import { L, R } from "@/field/dir"
import { Block } from "@/field/model"
import factorial from "@stdlib/math/base/special/factorial"
import gammaln from "@stdlib/math/base/special/gammaln"
import { complex, gamma, type Complex } from "mathjs"
import {
  declareFactorialC32,
  declareFactorialR32,
  factorialGlsl,
  FN_DIGAMMA,
  FN_POLYGAMMA,
} from "./factorial"

const FN_GAMMA: FnDist = new FnDist("gamma", "computes the gamma function", {
  deriv: unary((wrt, a) =>
    chain(a, wrt, {
      type: "call",
      fn: OP_JUXTAPOSE,
      args: [
        { type: "call", fn: FN_GAMMA, args: [a] },
        { type: "call", fn: FN_DIGAMMA, args: [a] },
      ],
    }),
  ),
})
  .add(
    ["r32"],
    "r32",
    (a) => {
      const val = num(a.value) - 1
      if (val == Math.floor(val) && val < 0) {
        return real(Infinity)
      }
      return real(factorial(val))
    },
    (ctx, a) => factorialGlsl(ctx, `(${a.expr} - 1.0)`),
    "gamma8=5040=7! =7\\cdot6\\cdot5\\cdot4\\cdot3\\cdot2\\cdot1",
  )
  .add(
    ["c32"],
    "c32",
    ({ value }) => {
      const x = num(value.x) - 1
      const y = num(value.y)
      if (y == 0 && x == Math.floor(x) && x < 0) {
        return rept({ x: Infinity, y: 0 })
      }
      // The type signature lies.
      const result = gamma(complex(x + 1, y)) as number | Complex
      if (typeof result == "number") {
        return rept({ x: result, y: 0 })
      } else {
        return rept({ x: result.re, y: result.im })
      }
    },
    (ctx, a) => {
      declareFactorialC32(ctx)
      return `_nya_helper_factorial(${a.expr} - vec2(1,0))`
    },
    "gamma(3+3i)=(2+3i)!≈-0.44011-0.06364i",
  )

const FN_LNGAMMA = new FnDist(
  "lngamma",
  "calculates the natural logarithm of the absolute value of the gamma function",
  {
    display([a, b]) {
      if (!(a && !b)) return

      const block = new Block(null)
      const cursor = block.cursor(R)
      new CmdWord("lnΓ", "prefix").insertAt(cursor, L)

      const arg = txr(a).display(a).block
      new CmdBrack("(", ")", null, arg).insertAt(cursor, L)

      return { block, lhs: Precedence.Atom, rhs: Precedence.Atom }
    },
    deriv: unary((props, a) =>
      chain(a, props, { type: "call", fn: FN_DIGAMMA, args: [a] }),
    ),
  },
).add(
  ["r32"],
  "r32",
  (x) => approx(gammaln(num(x.value))),
  (ctx, a) => {
    declareFactorialR32(ctx)
    ctx.glslText(lngammaGl)
    return `_nya_helper_lngamma(${a.expr})`
  },
  "lngamma23=ln((23+1)!)",
)

export default {
  name: "gamma functions",
  label: "functions related to the factorial and its derivative",
  category: "numbers",
  deps: ["core/ops", "num/complex", "factorial"],
  eval: {
    // DCG: lngamma and gamma are not available
    fn: {
      lngamma: FN_LNGAMMA,
      gamma: FN_GAMMA,
      digamma: FN_DIGAMMA,
      polygamma: FN_POLYGAMMA,
    },
  },
} satisfies Package
