import { FnDist } from "@/eval/ops/dist"

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
        div(a.value.x.add(b.value.x), int(2)),
        div(a.value.y.add(b.value.y), int(2)),
      ),
    (_, a, b) => `((${a.expr} + ${b.expr}) / 2.0)`,
    "midpoint((1,4),(3,8))=(2,6)",
  )
  .add(
    ["segment"],
    "point32",
    ({ value: [a, b] }) =>
      pt(div(a.x.add(b.x), int(2)), div(a.y.add(b.y), int(2))),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `((${a}.xy + ${a}.zw) / 2.0)`
    },
    "midpoint(segment((1,4),(3,8)))=(2,6)",
  )
