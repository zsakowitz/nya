import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { GlslVal, JsVal, SPoint, Val } from "@/eval/ty"

type LineLike = "segment" | "ray" | "line" | "vector"

export function parallelJs(
  { value: [A, B] }: JsVal<LineLike>,
  { value: b }: JsVal<"point32" | "point64">,
): Val<"line"> {
  return Object.assign(
    [b, pt(b.x.add(B.x.sub(A.x)), b.y.add(B.y.sub(A.y)))] satisfies [
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
  // DOCS: should there be examples for each type?
  .add(["segment", "point32"], "line", parallelJs, glsl, [])
  .add(["ray", "point32"], "line", parallelJs, glsl, [])
  .add(
    ["line", "point32"],
    "line",
    parallelJs,
    glsl,
    String.raw`\operatorname{parallel}\left(\operatorname{line}\left(\left(1,4\right),\left(5,9\right)\right),\left(2,3\right)\right)=\operatorname{line}\left(\left(2,3\right),\left(6,8\right)\right)`,
  )
  .add(["vector", "point32"], "line", parallelJs, glsl, [])
