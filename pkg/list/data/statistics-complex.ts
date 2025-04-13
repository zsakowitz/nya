import type { Package } from "#/types"
import { rept } from "@/eval/ty/create"
import { declareAddC64 } from "../core/ops"
import { addPt } from "../num/complex"
import { FN_TOTAL } from "./statistics"

FN_TOTAL.addSpread(
  "c64",
  "c64",
  (args) => args.reduce((a, b) => addPt(a, b), rept({ x: 0, y: 0 })),
  (ctx, ...args) => {
    if (!args.length) {
      return "vec4(0)"
    }
    declareAddC64(ctx)
    return args
      .map((x) => x.expr)
      .reduce((a, b) => `_helper_add_c64(${a}, ${b})`)
  },
  [],
).addSpread(
  "c32",
  "c32",
  (args) => args.reduce((a, b) => addPt(a, b), rept({ x: 0, y: 0 })),
  (_, ...args) => `(${args.map((x) => x.expr).join(" + ") || "0.0"})`,
  "total([8+3i,2-4i,-9])=1-i",
)

export default {
  name: "complex statistics",
  label: "rudimentary statistics for complex numbers",
  category: "statistics",
  eval: {
    fn: {
      total: FN_TOTAL,
    },
  },
} satisfies Package
