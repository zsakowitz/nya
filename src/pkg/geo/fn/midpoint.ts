import { pt, real } from "../../../eval/ty/create"
import { FnDist } from "../../../eval/ops/dist"
import { add } from "../../../eval/ops/op/add"
import { div } from "../../../eval/ops/op/div"

export const FN_MIDPOINT = new FnDist(
  "midpoint",
  "constructs the midpoint of a line segment or between two points",
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
  )
