import type { GlslContext } from "../../../../eval/lib/fn"
import { FnDist } from "../../../../eval/ops/dist"
import type { GlslVal, JsVal, SPoint } from "../../../../eval/ty"
import { pt, real } from "../../../../eval/ty/create"
import { add, div, sub } from "../../../../eval/ty/ops"

function js(a: JsVal<"segment">): [SPoint, SPoint] {
  const mx = div(add(a.value[0].x, a.value[1].x), real(2))
  const my = div(add(a.value[0].y, a.value[1].y), real(2))

  return [
    pt(mx, my),
    pt(
      add(mx, sub(a.value[1].y, a.value[0].y)),
      sub(my, sub(a.value[1].x, a.value[0].x)),
    ),
  ]
}

function glsl(ctx: GlslContext, a: GlslVal<"segment">) {
  ctx.glsl`vec4 _helper_perpendicularbisector(vec4 a) {
  vec2 m = (a.xy + a.zw) / 2.0;

  return vec4(
    m,
    m + vec2(
      a.w - a.y,
      a.x - a.z
    )
  );
}
`

  return `_helper_perpendicularbisector(${a.expr})`
}

export const FN_PERPENDICULARBISECTOR = new FnDist(
  "perpendicularbisector",
  "constucts the perpendicular bisector of a line segment or between two points",
)
  .add(["segment"], "line", js, glsl)
  .add(
    ["point32", "point32"],
    "line",
    (a, b) => js({ type: "segment", value: [a.value, b.value] }),
    (ctx, a, b) =>
      glsl(ctx, { type: "segment", expr: `vec4(${a.expr}, ${b.expr})` }),
  )
