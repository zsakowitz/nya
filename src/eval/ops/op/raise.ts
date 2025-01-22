import { FnDist } from "../dist"
import type { SPoint } from "../../ty"
import { isZero } from "../../ty/check"
import { approx, num, pt, real } from "../../ty/create"
import { declareExp, FN_EXP } from "../fn/exp"
import { declareMulC32, OP_CDOT } from "./mul"

export const OP_RAISE = new FnDist("^")
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => {
      if (isZero(b.value)) {
        return real(1)
      }

      if (isZero(a.value)) {
        return real(0)
      }

      return real(num(a.value) ** num(b.value))
    },
    (_, a, b) => {
      return `pow(${a.expr}, ${b.expr})`
    },
  )
  .add(
    ["c32", "c32"],
    "c32",
    ({ value: a }, { value: b }) => {
      if (isZero(b)) {
        if (b.x.type == "exact" && b.y.type == "exact") {
          return pt(real(1), real(0))
        } else {
          return pt(approx(1), approx(0))
        }
      }

      if (isZero(a)) {
        if (a.x.type == "exact" && a.y.type == "exact") {
          return pt(real(0), real(0))
        } else {
          return pt(approx(0), approx(0))
        }
      }

      return FN_EXP.js1(
        OP_CDOT.js1(
          { type: "c32", value: b },
          {
            type: "c32",
            value: pt(
              approx(Math.log(Math.hypot(num(a.x), num(a.y)))),
              approx(Math.atan2(num(a.y), num(a.x))),
            ),
          },
        ),
      ).value as SPoint
    },
    (ctx, a, b) => {
      declareMulC32(ctx)
      declareExp(ctx)
      ctx.glsl`vec2 _helper_pow_c32(vec2 a, vec2 b) {
  if (a == vec2(0)) {
    return vec2(0);
  } else {
    vec2 ln_a = vec2(log(length(a)), atan(a.y, a.x));
    return _helper_exp(_helper_mul_c32(b, ln_a));
  }
}
`
      return `_helper_pow_c32(${a.expr}, ${b.expr})`
    },
  )
