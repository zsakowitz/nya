import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { GlslVal, JsVal, SPoint } from "@/eval/ty"

function js(a: JsVal<"segment">): [SPoint, SPoint] {
  const mx = div(a.value[0].x.add(a.value[1].x), real(2))
  const my = div(a.value[0].y.add(a.value[1].y), real(2))

  return [
    pt(mx, my),
    pt(
      mx.add(a.value[1].y.sub(a.value[0].y)),
      my.sub(a.value[1].x.sub(a.value[0].x)),
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
  .add(
    ["segment"],
    "line",
    js,
    glsl,
    "perpendicularbisector(segment((1,5),(4,3)))=line((2.5,4),(0.5,1))",
  )
  .add(
    ["point32", "point32"],
    "line",
    (a, b) => js({ type: "segment", value: [a.value, b.value] }),
    (ctx, a, b) =>
      glsl(ctx, { type: "segment", expr: `vec4(${a.expr}, ${b.expr})` }),
    "perpendicularbisector((1,5),(4,3))=line((2.5,4),(0.5,1))",
  )
