import { num, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { abs } from "../../op/abs"
import { sub } from "../../op/sub"

export const FN_CIRCLE = new FnDist("circle")
  .add(
    ["point32", "r32"],
    "circle32",
    (a, b) => ({ center: a.value, radius: abs(b.value) }),
    (_, a, b) => `vec3(${a.expr}, abs(${b.expr}))`,
  )
  .add(
    ["point32", "point32"],
    "circle32",
    (a, b) => ({
      center: a.value,
      // TODO: use approx and exact better
      radius: real(
        Math.hypot(
          num(sub(a.value.x, b.value.x)),
          num(sub(a.value.y, b.value.y)),
        ),
      ),
    }),
    (ctx, ar, b) => {
      const a = ctx.cache(ar)
      return `vec3(${a}, length(${a} - ${b.expr}))`
    },
  )
