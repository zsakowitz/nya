import { FnDist } from "@/eval/ops/dist"
import { pt, real } from "@/eval/ty/create"
import { add, div } from "@/eval/ty/ops"

export const FN_MIDPOINT = new FnDist(
  "midpoint",
  "constructs the midpoint of a line segment or between two points",
  { message: "Cannot construct the midpoint of %%." },
)
  .add(
    ["point32", "point32"],
    "point32",
    (a, b) =>
      pt(
        div(add(a.value.x, b.value.x), real(2)),
        div(add(a.value.y, b.value.y), real(2)),
      ),
    (_, a, b) => `((${a.expr} + ${b.expr}) / 2.0)`,
    "midpoint((1,4),(3,8))=(2,6)",
  )
  .add(
    ["segment"],
    "point32",
    ({ value: [a, b] }) =>
      pt(div(add(a.x, b.x), real(2)), div(add(a.y, b.y), real(2))),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `((${a}.xy + ${a}.zw) / 2.0)`
    },
    "midpoint(segment((1,4),(3,8)))=(2,6)",
  )
