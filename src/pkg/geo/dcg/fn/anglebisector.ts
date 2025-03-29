import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { GlslVal, JsVal, SPoint } from "@/eval/ty"
import { pt } from "@/eval/ty/create"
import { add, sub } from "@/eval/ty/ops"
import { normVectorS } from "@/sheet/point"

export function bisectAngleJs(
  a: JsVal<"angle" | "directedangle">,
): [SPoint, SPoint] {
  const p1 = normVectorS(a.value[1], a.value[0])
  const p3 = normVectorS(a.value[1], a.value[2])

  return [
    a.value[1],
    normVectorS(
      a.value[1],
      pt(
        sub(add(p1.x, p3.x), a.value[1].x),
        sub(add(p1.y, p3.y), a.value[1].y),
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
).add(
  ["angle"],
  "ray",
  bisectAngleJs,
  glsl,
  // DOCS: maybe this should show its result
  "anglebisector(ray(...))",
)
