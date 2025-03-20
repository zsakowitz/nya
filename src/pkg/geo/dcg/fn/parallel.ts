import type { GlslContext } from "../../../../eval/lib/fn"
import { FnDist } from "../../../../eval/ops/dist"
import type { GlslVal, JsVal, SPoint, Val } from "../../../../eval/ty"
import { pt } from "../../../../eval/ty/create"
import { add, sub } from "../../../../eval/ty/ops"

type LineLike = "segment" | "ray" | "line" | "vector"

export function parallelJs(
  { value: [A, B] }: JsVal<LineLike>,
  { value: b }: JsVal<"point32" | "point64">,
): Val<"line"> {
  return Object.assign(
    [b, pt(add(b.x, sub(B.x, A.x)), add(b.y, sub(B.y, A.y)))] satisfies [
      SPoint,
      SPoint,
    ],
    { source: "parallel" as const },
  )
}

const glsl = (
  ctx: GlslContext,
  ar: GlslVal<LineLike>,
  br: GlslVal<"point32">,
): string => {
  const b = ctx.cache(br)
  const a = ctx.cache(ar)
  return `vec4(${b}, ${b} + ${a}.zw - ${a}.xy)`
}

export const FN_PARALLEL = new FnDist(
  "parallel",
  "creates a line parallel to an existing line which passes through some point",
)
  .add(["segment", "point32"], "line", parallelJs, glsl)
  .add(["ray", "point32"], "line", parallelJs, glsl)
  .add(["line", "point32"], "line", parallelJs, glsl)
  .add(["vector", "point32"], "line", parallelJs, glsl)
