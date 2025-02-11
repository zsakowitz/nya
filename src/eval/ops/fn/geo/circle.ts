import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, JsVal } from "../../../ty"
import { num, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { abs } from "../../op/abs"
import { sub } from "../../op/sub"
import { dist } from "./distance"

function js(a: JsVal<"point32">, b: JsVal<"point32">) {
  return {
    center: a.value,
    // TODO: use approx and exact better
    radius: real(
      Math.hypot(
        num(sub(a.value.x, b.value.x)),
        num(sub(a.value.y, b.value.y)),
      ),
    ),
  }
}

function glsl(ctx: GlslContext, ar: GlslVal<"point32">, b: GlslVal<"point32">) {
  const a = ctx.cache(ar)
  return `vec3(${a}, length(${a} - ${b.expr}))`
}

export const FN_CIRCLE = new FnDist(
  "circle",
  "constructs a circle given its center and either its numerical radius or a point on its circumference",
)
  .add(
    ["point32", "r32"],
    "circle",
    (a, b) => ({ center: a.value, radius: abs(b.value) }),
    (_, a, b) => `vec3(${a.expr}, abs(${b.expr}))`,
  )
  .add(
    ["point32", "segment"],
    "circle",
    (a, b) => ({ center: a.value, radius: dist(b.value[0], b.value[1]) }),
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `vec3(${a.expr}, length(${b}.xy - ${b}.zw))`
    },
  )
  .add(["point32", "point32"], "circle", js, glsl)
