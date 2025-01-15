import type { GlslContext } from "../../fn"
import { FnDist } from "../../fn/dist"
import type { SColor } from "../../ty"
import { frac, num, real } from "../../ty/create"
import type { JsVal } from "../../ty2"

function doHsv(
  hr: JsVal<"r32">,
  sr: JsVal<"r32">,
  vr: JsVal<"r32">,
  ar: JsVal<"r32">,
): SColor {
  const h = num(hr.value) / 360
  const s = num(sr.value)
  const v = num(vr.value)

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
    a: ar.value,
  }
}

function declareHsv(ctx: GlslContext) {
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
    (hr, sr, vr) => doHsv(hr, sr, vr, { type: "r32", value: frac(1, 1) }),
    (ctx, hr, sr, vr) => {
      declareHsv(ctx)
      return `vec4(_helper_hsv(${hr.expr}, ${sr.expr}, ${vr.expr}), 1)`
    },
  )
  .add(
    ["r32", "r32", "r32", "r32"],
    "color",
    (hr, sr, vr, ar) => doHsv(hr, sr, vr, ar),
    (ctx, hr, sr, vr, ar) => {
      declareHsv(ctx)
      return `vec4(_helper_hsv(${hr.expr}, ${sr.expr}, ${vr.expr}), ${ar.expr})`
    },
  )
