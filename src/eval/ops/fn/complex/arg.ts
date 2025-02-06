import { approx, num } from "../../../ty/create"
import { FnDist } from "../../dist"

export const FN_ARG = new FnDist(
  "arg",
  "returns the angle between a point and the x-axis",
)
  .add(
    ["c32"],
    "r32",
    ({ value: a }) => approx(Math.atan2(num(a.y), num(a.x))),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `atan(${a}.y, ${a}.x)`
    },
  )
  .add(
    ["point32"],
    "r32",
    ({ value: a }) => approx(Math.atan2(num(a.y), num(a.x))),
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `atan(${a}.y, ${a}.x)`
    },
  )
