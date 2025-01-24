import type { GlslContext } from "../../lib/fn"
import { FnDist } from "../dist"
import type { SReal } from "../../ty"
import { num, real } from "../../ty/create"

function js(a: { value: SReal }, b: { value: SReal }) {
  const ar = num(a.value)
  const br = num(b.value)
  return (
    ar < br ? real(-1)
    : ar > br ? real(1)
    : real(0)
  )
}

export function declareCmpR64(ctx: GlslContext) {
  ctx.glsl`
float _helper_cmp_r64(vec2 a, vec2 b) {
  if (a.x < b.x) {
    return -1.0;
  } else if (a.x > b.x) {
    return 1.0;
  } else if (a.y < b.y) {
    return -1.0;
  } else if (a.y > b.y) {
    return 1.0;
  } else {
    return 0.0;
  }
}
`
}

export const FN_CMP = new FnDist("cmp")
  // TODO: NaN probably outputs 0 in r64
  .add(["r64", "r64"], "r32", js, (ctx, a, b) => {
    declareCmpR64(ctx)
    return `_helper_cmp_r64(${a.expr}, ${b.expr})`
  })
  .add(["r32", "r32"], "r32", js, (ctx, a, b) => {
    ctx.glsl`
float _helper_cmp_r32(float a, float b) {
  if (a < b) {
    return -1.0;
  } else if (a > b) {
    return 1.0;
  } else {
    return 0.0;
  }
}
`
    return `_helper_cmp_r32(${a.expr}, ${b.expr})`
  })
