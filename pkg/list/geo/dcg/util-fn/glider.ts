import type { GlslContext } from "@/eval/lib/fn"
import type { GlslVal, SPoint, SReal } from "@/eval/ty"
import { FN_GLIDER } from "../../point"
import { computeArcVal, glideArc } from "../util-arc"

function js(
  { value: [{ x: x1, y: y1 }, { x: x2, y: y2 }] }: { value: [SPoint, SPoint] },
  { value: t }: { value: SReal },
) {
  const s = sub(real(1), t)
  return pt(x1.mul(s).add(x2.mul(t)), y1.mul(s).add(y2.mul(t)))
}

function glsl(ctx: GlslContext, ar: GlslVal, b: GlslVal) {
  const a = ctx.cache(ar)
  return `mix(${a}.xy, ${a}.zw, ${b.expr})`
}

FN_GLIDER.add(["segment", "r32"], "point32", js, glsl, [])
  .add(["ray", "r32"], "point32", js, glsl, [])
  .add(
    ["line", "r32"],
    "point32",
    js,
    glsl,
    "glider(line((2,3),(7,9)),0.3)=(3.5,4.8)",
  )
  .add(
    ["circle", "r32"],
    "point32",
    ({ value: { center, radius } }, tr) => {
      const x = center.x.num()
      const y = center.y.num()
      const r = radius.num()
      const t = 2 * Math.PI * tr.value.num()

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
    "glider(circle((2,3),(7,9)),0.3)≈(-0.4135,10.4280)",
  )
  .add(
    ["arc", "r32"],
    "point32",
    (arc, t) => {
      return rept(glideArc(computeArcVal(arc.value), t.value.num()))
    },
    () => {
      // TODO:
      throw new Error("'glider' on an arc isn't supported in shaders yet.")
    },
    "glider(arc((2,3),(7,9),(4,-1)),0.3)≈(-7.7549,9.0412)",
  )
