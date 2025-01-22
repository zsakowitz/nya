import { pt, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { add } from "../../op/add"
import { div } from "../../op/div"

export const FN_MIDPOINT = new FnDist("midpoint")
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
    ["segment32"],
    "point32",
    ({ value: [a, b] }) =>
      pt(div(add(a.x, b.x), real(2)), div(add(a.y, b.y), real(2))),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `((${a}.xy + ${a}.zw) / 2.0)`
    },
  )
