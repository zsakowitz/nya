import { FnDist } from "@/eval/ops/dist"
import { int } from "@/lib/sreal"

export const FN_MIDPOINT = new FnDist(
  "midpoint",
  "constructs the midpoint of a line segment or between two points",
  { message: "Cannot construct the midpoint of %%." },
)
  .add(
    ["point32", "point32"],
    "point32",
    (a, b) => a.value.add(b.value).divR(int(2)),
    (_, a, b) => `((${a.expr} + ${b.expr}) / 2.0)`,
    "midpoint((1,4),(3,8))=(2,6)",
  )
  .add(
    ["segment"],
    "point32",
    ({ value: [a, b] }) => a.add(b).divR(int(2)),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `((${a}.xy + ${a}.zw) / 2.0)`
    },
    "midpoint(segment((1,4),(3,8)))=(2,6)",
  )
