import type { GlslContext } from "../../lib/fn"
import { FnDist } from "../dist"

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

export const FN_CMP = new FnDist(
  "cmp",
  "compares two numbers, returning -1, 0, or 1, depending on whether the first number is less than, equal to, or greater than the second number",
)
