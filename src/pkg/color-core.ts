import type { Package } from "."
import type { GlslContext } from "../eval/lib/fn"
import { FnDist } from "../eval/ops/dist"
import type { SColor, SReal } from "../eval/ty"
import { frac, num, real } from "../eval/ty/create"

export const FN_RGB = new FnDist(
  "rgb",
  "creates a color given its red, green, and blue components",
)
  .add(
    ["r32", "r32", "r32"],
    "color",
    (r, g, b) => ({
      type: "color",
      r: r.value,
      g: g.value,
      b: b.value,
      a: real(1),
    }),
    (_, r, g, b) => `vec4(vec3(${r.expr}, ${g.expr}, ${b.expr}) / 255.0, 1)`,
  )
  .add(
    ["r32", "r32", "r32", "r32"],
    "color",
    (r, g, b, a) => ({
      type: "color",
      r: r.value,
      g: g.value,
      b: b.value,
      a: a.value,
    }),
    (_, r, g, b, a) =>
      `vec4(vec3(${r.expr}, ${g.expr}, ${b.expr}) / 255.0, ${a.expr})`,
  )

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

export const FN_HSV = new FnDist(
  "hsv",
  "creates a color given its hue (0-360), saturation (0-1), and value (0-1)",
)
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

export function plotJs(): never {
  throw new Error("Cannot plot colors outside of a shader.")
}

export const OP_PLOT = new FnDist<"color">(
  "plot",
  "converts an expression to the color it plots as a shader",
).add(["color"], "color", plotJs, (_, a) => a.expr)

export const PKG_COLOR_CORE: Package = {
  id: "nya:color-core",
  name: "color functions core",
  label: "adds very basic color functions",
  eval: {
    fns: {
      rgb: FN_RGB,
      hsv: FN_HSV,
    },
  },
}
