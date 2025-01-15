import { FnDist } from "../../../fn/dist"
import type { SReal } from "../../../ty"
import { approx, frac } from "../../../ty/create"
import { declareCmpR64 } from "../fn/cmp"
import { declareSubR64 } from "./sub"

export function abs(v: SReal): SReal {
  if (v.type == "exact") {
    return frac(Math.abs(v.n), v.d)
  } else {
    return approx(Math.abs(v.value))
  }
}

export const OP_ABS = new FnDist("abs")
  .add(
    ["r64"],
    "r64",
    (x) => abs(x.value),
    (ctx, x) => {
      declareCmpR64(ctx)
      declareSubR64(ctx)
      ctx.glsl`vec2 _helper_abs_r64(vec2 x) {
  if (_helper_cmp_r64(x) == -1.0) {
    x = _helper_sub_r64(vec2(0), x);
  }
  return x;
}
`
      return `_helper_abs_r64(${x.expr})`
    },
  )
  .add(
    ["r32"],
    "r32",
    (x) => abs(x.value),
    (_, x) => `abs(${x.expr})`,
  )
