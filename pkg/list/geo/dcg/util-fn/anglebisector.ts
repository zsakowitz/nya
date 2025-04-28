import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { GlslVal, JsVal } from "@/eval/ty"
import type { SPoint } from "@/lib/point"

export function bisectAngleJs(
  a: JsVal<"angle" | "directedangle">,
): [SPoint, SPoint] {
  const b = a.value[1]
  const p1 = a.value[0].sub(b).norm()
  const p3 = a.value[2].sub(b).norm()
  return [b, p1.add(p3).norm().add(b)]
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
