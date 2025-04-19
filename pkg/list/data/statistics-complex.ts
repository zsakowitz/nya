import type { Package } from "#/types"
import { declareAddC64 } from "$/core/ops"
import { addPt } from "$/num/complex"
import { FN_MEAN, FN_TOTAL } from "./statistics"

FN_TOTAL.addSpread(
  "c64",
  "c64",
  (args) => args.reduce((a, b) => a.add(b), rept({ x: 0, y: 0 })),
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
  (args) => args.reduce((a, b) => a.add(b), rept({ x: 0, y: 0 })),
  (_, ...args) => `(${args.map((x) => x.expr).join(" + ") || "0.0"})`,
  "total([8+3i,2-4i,-9])=1-i",
)

FN_MEAN.addSpread(
  "c64",
  "c64",
  (args) => args.reduce((a, b) => a.add(b), rept({ x: 0, y: 0 })),
  (ctx, ...args) => {
    if (!args.length) {
      return "vec4(0.0/0.0)"
    }
    declareAddC64(ctx)
    return `(${args
      .map((x) => x.expr)
      .reduce(
        (a, b) => `_helper_add_c64(${a}, ${b})`,
      )} / ${args.length.toExponential()})`
  },
  [],
).addSpread(
  "c32",
  "c32",
  (args) => args.reduce((a, b) => a.add(b), rept({ x: 0, y: 0 })),
  (_, ...args) =>
    `((${args.map((x) => x.expr).join(" + ") || "0.0"}) / ${args.length.toExponential()})`,
  "mean([8+3i,2-4i,-9,-i])=0.25-0.5i",
)

export default {
  name: "complex statistics",
  label: "rudimentary statistics for complex numbers",
  category: "statistics",
  deps: ["data/statistics", "num/complex"],
  eval: {
    fn: {
      total: FN_TOTAL,
    },
  },
} satisfies Package
