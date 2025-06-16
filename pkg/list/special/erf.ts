import erfGl from "#/glsl/erf.glsl"
import erfinvGl from "#/glsl/erfinv.glsl"
import type { Package } from "#/types"
import { chain, OP_DIV, OP_JUXTAPOSE, OP_NEG, OP_RAISE } from "$/core/ops"
import { FnDist } from "@/eval/ops/dist"
import { SYM_2, SYM_E, SYM_HALF, SYM_PI, unary } from "@/eval/sym"
import { approx } from "@/lib/real"
import erf from "@stdlib/math/base/special/erf"
import erfinv from "@stdlib/math/base/special/erfinv"

export const FN_ERF = new FnDist(
  "erf",
  "error function; related to area of a normal distribution",
  {
    deriv: unary((wrt, a) =>
      chain(a, wrt, {
        type: "call",
        fn: OP_JUXTAPOSE,
        args: [
          {
            type: "call",
            fn: OP_DIV,
            args: [
              SYM_2,
              {
                type: "call",
                fn: OP_RAISE,
                args: [SYM_PI, SYM_HALF],
              },
            ],
          },
          {
            type: "call",
            fn: OP_RAISE,
            args: [
              SYM_E,
              {
                type: "call",
                fn: OP_NEG,
                args: [{ type: "call", fn: OP_RAISE, args: [a, SYM_2] }],
              },
            ],
          },
        ],
      }),
    ),
  },
)
  .add(
    ["r32"],
    "r32",
    (a) => approx(erf(a.value.num())),
    (ctx, a) => {
      ctx.glslText(erfGl)
      return `_nya_helper_erf(${a.expr})`
    },
    "erf(1)≈0.842700",
  )
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => approx(erf(b.value.num()) - erf(a.value.num())),
    (ctx, a, b) => {
      ctx.glslText(erfGl)
      return `(_nya_helper_erf(${b.expr}) - _nya_helper_erf(${a.expr}))`
    },
    "erf(-1,1)≈1.6854",
  )

const FN_ERFINV = new FnDist("erfinv", "inverse error function").add(
  ["r32"],
  "r32",
  (a) => approx(erfinv(a.value.num())),
  (ctx, a) => {
    ctx.glslText(erfinvGl)
    return `_nya_helper_erfinv(${a.expr})`
  },
  "erf^{-1}(0.8427)≈1",
)

export default {
  name: "error function",
  label: "on the real numbers",
  category: "numbers",
  deps: ["num/real", "core/ops"],
  scripts: ["real/erf"],
  eval: {
    fn: {
      erf: FN_ERF,
      "erf^-1": FN_ERFINV,
    },
  },
} satisfies Package
