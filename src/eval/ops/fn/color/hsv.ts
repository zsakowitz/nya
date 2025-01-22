import type { GlslContext } from "../../../fn"
import type { SColor, SReal } from "../../../ty"
import { frac, num, real } from "../../../ty/create"
import { FnDist } from "../../dist"

export function hsv(hr: SReal, sr: SReal, vr: SReal, a: SReal): SColor {
  const h = num(hr) / 360
  const s = num(sr)
  const v = num(vr)

  // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
  let r, g, b
  let i = Math.floor(h * 6)
  let f = h * 6 - i
  let p = v * (1 - s)
  let q = v * (1 - f * s)
  let t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0:
      ;(r = v), (g = t), (b = p)
      break
    case 1:
      ;(r = q), (g = v), (b = p)
      break
    case 2:
      ;(r = p), (g = v), (b = t)
      break
    case 3:
      ;(r = p), (g = q), (b = v)
      break
    case 4:
      ;(r = t), (g = p), (b = v)
      break
    case 5:
      ;(r = v), (g = p), (b = q)
      break
    default:
      throw new Error("Never occurs.")
  }
  return {
    type: "color",
    r: real(255.0 * r),
    g: real(255.0 * g),
    b: real(255.0 * b),
    a,
  }
}

export function declareHsv(ctx: GlslContext) {
  ctx.glsl`const vec4 _helper_hsv_const = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);

vec3 _helper_hsv(vec3 c) {
  vec3 p = abs(fract(c.xxx + _helper_hsv_const.xyz) * 6.0 - _helper_hsv_const.www);
  return c.z * mix(_helper_hsv_const.xxx, clamp(p - _helper_hsv_const.xxx, 0.0, 1.0), c.y);
}
`
}

export const FN_HSV = new FnDist("hsv")
  .add(
    ["r32", "r32", "r32"],
    "color",
    (hr, sr, vr) => hsv(hr.value, sr.value, vr.value, frac(1, 1)),
    (ctx, hr, sr, vr) => {
      declareHsv(ctx)
      return `vec4(_helper_hsv(vec3(${hr.expr} / 360.0, ${sr.expr}, ${vr.expr})), 1)`
    },
  )
  .add(
    ["r32", "r32", "r32", "r32"],
    "color",
    (hr, sr, vr, ar) => hsv(hr.value, sr.value, vr.value, ar.value),
    (ctx, hr, sr, vr, ar) => {
      declareHsv(ctx)
      return `vec4(_helper_hsv(vec3(${hr.expr} / 360.0, ${sr.expr}, ${vr.expr})), ${ar.expr})`
    },
  )
