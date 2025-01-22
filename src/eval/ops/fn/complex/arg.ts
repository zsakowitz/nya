import { FnDist } from "../../dist"
import { approx, num } from "../../../ty/create"

export const FN_ARG = new FnDist("arg").add(
  ["c32"],
  "r32",
  ({ value: a }) => approx(Math.atan2(num(a.y), num(a.x))),
  (ctx, ar) => {
    const a = ctx.cache(ar)
    return `atan(${a}.y, ${a}.x)`
  },
)
