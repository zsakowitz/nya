import { FnDist } from "../../fn/dist"
import { isZero } from "../../ty/check"
import { approx, num, pt, real } from "../../ty/create"

export const FN_LN = new FnDist("ln").add(
  ["c32"],
  "c32",
  ({ value: a }) => {
    if (isZero(a)) {
      return pt(real(-Infinity), real(0))
    }

    const x = num(a.x)
    const y = num(a.y)

    return pt(approx(Math.log(Math.hypot(x, y))), approx(Math.atan2(y, x)))
  },
  (ctx, a) => {
    ctx.glsl`vec2 _helper_ln_c32(vec2 z) {
  if (z == vec2(0)) {
    return vec2(-1.0 / 0.0, 0);
  }

  return vec2(log(length(z)), atan(z.y, z.x));
}
`
    return `_helper_ln_c32(${a.expr})`
  },
)
