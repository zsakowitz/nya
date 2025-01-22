import { pt } from "../../../ty/create"
import { FnDist } from "../../dist"
import { add } from "../../op/add"
import { sub } from "../../op/sub"

export const FN_PARALLEL = new FnDist("parallel").add(
  ["line32", "point32"],
  "line32",
  ({ value: [A, B] }, { value: b }) => [
    b,
    pt(add(b.x, sub(B.x, A.x)), add(b.y, sub(B.y, A.y))),
  ],
  (ctx, ar, br) => {
    const b = ctx.cache(br)
    const a = ctx.cache(ar)
    return `vec4(${b}, ${b} + ${a}.zw - ${a}.xy)`
  },
)
