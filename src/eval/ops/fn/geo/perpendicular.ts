import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, SPoint, Tys, Val } from "../../../ty"
import { pt } from "../../../ty/create"
import { FnDist } from "../../dist"
import { add } from "../../op/add"
import { sub } from "../../op/sub"

type LineLike = "segment" | "ray" | "line" | "vector"

export function perpendicularJs(
  { value: [A, B] }: { value: Tys["line"] },
  { value: b }: { value: SPoint },
): Val<"line"> {
  return [b, pt(add(b.x, sub(B.y, A.y)), sub(b.y, sub(B.x, A.x)))]
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
  .add(["segment", "point32"], "line", perpendicularJs, glsl)
  .add(["ray", "point32"], "line", perpendicularJs, glsl)
  .add(["line", "point32"], "line", perpendicularJs, glsl)
  .add(["vector", "point32"], "line", perpendicularJs, glsl)
