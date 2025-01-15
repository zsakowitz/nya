import { FnDist } from "../../../fn/dist"
import { declareMulR64, mul } from "../op/mul"
import { declareSubR64, sub } from "../op/sub"

export const FN_DOT = new FnDist("dot")
  .add(
    ["c64", "c64"],
    "r64",
    (a, b) => sub(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    (ctx, a, b) => {
      declareSubR64(ctx)
      declareMulR64(ctx)
      ctx.glsl`vec2 _helper_dot_c64(vec4 a, vec4 b) {
  return _helper_sub_r64(
    _helper_mul_r64(a.xy, b.xy),
    _helper_mul_r64(a.zw, b.zw)
  );
}`
      return `_helper_dot_c64(${a.expr}, ${b.expr})`
    },
  )
  .add(
    ["c32", "c32"],
    "r32",
    (a, b) => sub(mul(a.value.x, b.value.x), mul(a.value.y, b.value.y)),
    (ctx, a, b) => {
      ctx.glsl`float _helper_dot_c32(vec2 a, vec2 b) {
  return a.x * b.x - a.y * b.y;
}`
      return `_helper_dot_c32(${a.expr}, ${b.expr})`
    },
  )
