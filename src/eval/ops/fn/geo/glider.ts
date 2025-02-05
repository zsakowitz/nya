import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, SPoint, SReal } from "../../../ty"
import { pt, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { add } from "../../op/add"
import { mul } from "../../op/mul"
import { sub } from "../../op/sub"

function js(
  { value: [{ x: x1, y: y1 }, { x: x2, y: y2 }] }: { value: [SPoint, SPoint] },
  { value: t }: { value: SReal },
) {
  const s = sub(real(1), t)
  return pt(add(mul(x1, s), mul(x2, t)), add(mul(y1, s), mul(y2, t)))
}

function glsl(ctx: GlslContext, ar: GlslVal, b: GlslVal) {
  const a = ctx.cache(ar)
  return `mix(${a}.xy, ${a}.zw, ${b})`
}

export const FN_GLIDER = new FnDist("glider")
  .add(["line32", "r32"], "point32", js, glsl)
  .add(["segment32", "r32"], "point32", js, glsl)
  .add(["vector32", "r32"], "point32", js, glsl)
  .add(["ray32", "r32"], "point32", js, glsl)
