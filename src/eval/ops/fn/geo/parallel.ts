import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, JsVal, Val } from "../../../ty"
import { pt } from "../../../ty/create"
import { FnDist } from "../../dist"
import { add } from "../../op/add"
import { sub } from "../../op/sub"

type LineLike = "segment" | "ray" | "line" | "vector"

const js = (
  { value: [A, B] }: JsVal<LineLike>,
  { value: b }: JsVal<"point32" | "point64">,
): Val<"line"> => [b, pt(add(b.x, sub(B.x, A.x)), add(b.y, sub(B.y, A.y)))]

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
  .add(["segment", "point32"], "line", js, glsl)
  .add(["ray", "point32"], "line", js, glsl)
  .add(["line", "point32"], "line", js, glsl)
  .add(["vector", "point32"], "line", js, glsl)
