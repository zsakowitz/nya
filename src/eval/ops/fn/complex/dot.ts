import type { GlslContext } from "../../../lib/fn"
import type { GlslVal } from "../../../ty"
import { FnDist } from "../../dist"
import { declareMulR64, mul } from "../../op/mul"
import { declareSubR64, sub } from "../../op/sub"

function c64(
  ctx: GlslContext,
  a: GlslVal<"c64" | "point64">,
  b: GlslVal<"c64" | "point64">,
) {
  declareSubR64(ctx)
  declareMulR64(ctx)
  ctx.glsl`vec2 _helper_dot_c64(vec4 a, vec4 b) {
  return _helper_sub_r64(
    _helper_mul_r64(a.xy, b.xy),
    _helper_mul_r64(a.zw, b.zw)
  );
}`
  return `_helper_dot_c64(${a.expr}, ${b.expr})`
}

function c32(
  ctx: GlslContext,
  a: GlslVal<"c32" | "point32">,
  b: GlslVal<"c32" | "point32">,
) {
  ctx.glsl`float _helper_dot_c32(vec2 a, vec2 b) {
  return a.x * b.x - a.y * b.y;
}`
  return `_helper_dot_c32(${a.expr}, ${b.expr})`
}

export const FN_DOT = new FnDist(
  "dot",
  "takes the dot product of two complex numbers",
)
  .add(
    ["c64", "c64"],
    "r64",
    (a, b) => sub(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    c64,
  )
  .add(
    ["c32", "c32"],
    "r32",
    (a, b) => sub(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    c32,
  )
