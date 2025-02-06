import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, SPoint, SReal } from "../../../ty"
import { num, pt, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { add } from "../../op/add"
import { mul } from "../../op/mul"
import { sub } from "../../op/sub"

function js(
  { value: [{ x: x1, y: y1 }, { x: x2, y: y2 }] }: { value: [SPoint, SPoint] },
  { value: t }: { value: SReal },
) {
  const s = sub(real(1), t)
  return pt(add(mul(x1, s), mul(x2, t)), add(mul(y1, s), mul(y2, t)))
}

function glsl(ctx: GlslContext, ar: GlslVal, b: GlslVal) {
  const a = ctx.cache(ar)
  return `mix(${a}.xy, ${a}.zw, ${b.expr})`
}

export const FN_GLIDER = new FnDist("glider", "constructs a point on an object")
  .add(["segment32", "r32"], "point32", js, glsl)
  .add(["ray32", "r32"], "point32", js, glsl)
  .add(["line32", "r32"], "point32", js, glsl)
  .add(
    ["circle32", "r32"],
    "point32",
    ({ value: { center, radius } }, tr) => {
      const x = num(center.x)
      const y = num(center.y)
      const r = num(radius)
      const t = 2 * Math.PI * num(tr.value)

      return pt(real(x + r * Math.cos(t)), real(y + r * Math.sin(t)))
    },
    (ctx, ar, tr) => {
      const a = ctx.cache(ar)
      const t = ctx.cache({
        type: "r32",
        expr: `(${tr.expr} * ${2 * Math.PI})`,
      })
      return `vec2(${a}.xy) + ${a}.z * vec2(cos(${t}), sin(${t}))`
    },
  )
