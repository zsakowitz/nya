import type { Package } from "#/types"
import { declareAddC64 } from "$/core/ops"
import { xyint } from "@/lib/complex"
import { FN_MEAN, FN_TOTAL } from "./statistics"

FN_TOTAL.addSpread(
  "c64",
  "c64",
  (args) => args.reduce((a, b) => a.add(b), xyint(0, 0)),
  (ctx, ...args) => {
    if (!args.length) {
      return "vec4(0)"
    }

    const ret = ctx.name()
    ctx.push`vec4 ${ret} = vec4(0.0);\n`
    for (const arg of args) {
      ctx.push`${ret} = _helper_add_c64(${ret}, ${arg.expr});\n`
    }
    return ret
  },
  [],
).addSpread(
  "c32",
  "c32",
  (args) => args.reduce((a, b) => a.add(b), xyint(0, 0)),
  (ctx, ...args) => {
    const ret = ctx.name()
    ctx.push`vec2 ${ret} = vec2(0.0);\n`
    for (const arg of args) {
      ctx.push`${ret} += ${arg.expr};\n`
    }
    return ret
  },
  "total([8+3i,2-4i,-9])=1-i",
)

FN_MEAN.addSpread(
  "c64",
  "c64",
  (args) => args.reduce((a, b) => a.add(b), xyint(0, 0)),
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
  (args) => args.reduce((a, b) => a.add(b), xyint(0, 0)),
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
