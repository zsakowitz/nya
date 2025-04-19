import type { GlslContext } from "@/eval/lib/fn"
import { FnDist } from "@/eval/ops/dist"
import type { GlslVal, Tys, Val } from "@/eval/ty"
import { pt, type SPoint } from "@/lib/point"

type LineLike = "segment" | "ray" | "line" | "vector"

export function perpendicularJs(
  { value: [A, B] }: { value: Tys["line"] },
  { value: b }: { value: SPoint },
): Val<"line"> {
  return Object.assign(
    [b, pt([b.x.add(B.y.sub(A.y)), b.y.sub(B.x.sub(A.x))])] satisfies [
      SPoint,
      SPoint,
    ],
    { source: "perpendicular" as const },
  )
}

const glsl = (
  ctx: GlslContext,
  ar: GlslVal<LineLike>,
  br: GlslVal<"point32">,
): string => {
  const b = ctx.cache(br)
  const a = ctx.cache(ar)
  return `vec4(${b}, ${b} + vec2(${a}.w - ${a}.y, ${a}.x - ${a}.z))`
}

export const FN_PERPENDICULAR = new FnDist(
  "perpendicular",
  "creates a line perpendicular to an existing line which passes through some point",
)
  // DOCS: should each overload have an example
  .add(["segment", "point32"], "line", perpendicularJs, glsl, [])
  .add(["ray", "point32"], "line", perpendicularJs, glsl, [])
  .add(
    ["line", "point32"],
    "line",
    perpendicularJs,
    glsl,
    String.raw`\operatorname{perpendicular}\left(\operatorname{line}\left(\left(1,4\right),\left(5,9\right)\right),\left(2,3\right)\right)=\operatorname{line}\left(\left(2,3\right),\left(7,-1\right)\right)`,
  )
  .add(["vector", "point32"], "line", perpendicularJs, glsl, [])
