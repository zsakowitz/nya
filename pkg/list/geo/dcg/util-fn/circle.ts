import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { GlslVal, JsVal } from "@/eval/ty"
import { crArcVal } from "../util-arc"
import { dist } from "./distance"

function js(a: JsVal<"point32">, b: JsVal<"point32">) {
  return {
    center: a.value,
    // TODO: use approx and exact better
    radius: real(
      Math.hypot(num(a.value.x.sub(b.value.x)), num(a.value.y.sub(b.value.y))),
    ),
  }
}

function glsl(ctx: GlslContext, ar: GlslVal<"point32">, b: GlslVal<"point32">) {
  const a = ctx.cache(ar)
  return `vec3(${a}, length(${a} - ${b.expr}))`
}

export const FN_CIRCLE = new FnDist(
  "circle",
  "constructs a circle from a center and radius",
)
  .add(
    ["point32", "r32"],
    "circle",
    (a, b) => ({ center: a.value, radius: abs(b.value) }),
    (_, a, b) => `vec3(${a.expr}, abs(${b.expr}))`,
    "circle((4,3),7)",
  )
  .add(
    ["point32", "segment"],
    "circle",
    (a, b) => ({ center: a.value, radius: dist(b.value[0], b.value[1]) }),
    (ctx, a, br) => {
      const b = ctx.cache(br)
      return `vec3(${a.expr}, length(${b}.xy - ${b}.zw))`
    },
    "circle((4,3),segment(...))",
  )
  .add(["point32", "point32"], "circle", js, glsl, "circle((4,3),(8,9))")
  .add(
    ["arc"],
    "circle",
    (a) => {
      const { c, r } = crArcVal(a.value)
      return {
        center: rept(c),
        radius: int(r),
      }
    },
    () => {
      // TODO:
      throw new Error("Cannot convert an arc into a circle in shaders yet.")
    },
    String.raw`circle(\operatorname{arc}\left(\left(-6,4\right),\left(3,2\right),\left(0,5\right)\right))`,
  )
