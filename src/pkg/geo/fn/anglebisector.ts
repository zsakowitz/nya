import type { GlslContext } from "../../../eval/lib/fn"
import { FnDist } from "../../../eval/ops/dist"
import type { GlslVal, JsVal, SPoint } from "../../../eval/ty"
import { pt } from "../../../eval/ty/create"
import { add, sub } from "../../../eval/ty/ops"
import { normSegmentS } from "../../../sheet/ui/paper"

function js(a: JsVal<"angle" | "directedangle">): [SPoint, SPoint] {
  return [
    a.value[1],
    normSegmentS(
      a.value[1],
      pt(
        sub(add(a.value[0].x, a.value[2].x), a.value[1].x),
        sub(add(a.value[0].y, a.value[2].y), a.value[1].y),
      ),
    ),
  ]
}

function glsl(ctx: GlslContext, a: GlslVal<"angle" | "directedangle">) {
  ctx.glsl`vec4 _helper_anglebisector(mat3x2 a) {
  return vec4(
    a[1],
    a[1] + norm(a[0] + a[2] - a[1]),
  );
}
`

  return `_helper_anglebisector(${a.expr})`
}

export const FN_ANGLEBISECTOR = new FnDist(
  "anglebisector",
  "constucts the bisector of an angle",
).add(["angle"], "ray", js, glsl)
