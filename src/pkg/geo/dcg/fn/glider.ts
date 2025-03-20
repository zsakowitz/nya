import type { GlslContext } from "../../../../eval/lib/fn"
import type { GlslVal, SPoint, SReal } from "../../../../eval/ty"
import { num, pt, real, rept } from "../../../../eval/ty/create"
import { add, mul, sub } from "../../../../eval/ty/ops"
import { FN_GLIDER } from "../../../geo-point"
import { computeArcVal, glideArc } from "../arc"

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

FN_GLIDER.add(["segment", "r32"], "point32", js, glsl)
  .add(["ray", "r32"], "point32", js, glsl)
  .add(["line", "r32"], "point32", js, glsl)
  .add(
    ["circle", "r32"],
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
  .add(
    ["arc", "r32"],
    "point32",
    (arc, t) => {
      return rept(glideArc(computeArcVal(arc.value), num(t.value)))
    },
    () => {
      // TODO:
      throw new Error("'glider' on an arc isn't supported in shaders yet.")
    },
  )
