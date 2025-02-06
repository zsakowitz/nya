import type { GlslContext } from "../../../lib/fn"
import { FnDist } from "../../dist"

export function oklab(
  ctx: GlslContext,
  a: string,
  b: string,
  c: string,
  alpha: string,
) {
  ctx.glsl`// https://github.com/patriciogonzalezvivo/lygia/blob/main/color/space/oklab2rgb.glsl
const mat3 _helper_oklab_OKLAB2RGB_A = mat3(
  1.0,           1.0,           1.0,
  0.3963377774, -0.1055613458, -0.0894841775,
  0.2158037573, -0.0638541728, -1.2914855480);
const mat3 _helper_oklab_OKLAB2RGB_B = mat3(
  4.0767416621, -1.2684380046, -0.0041960863,
  -3.3077115913, 2.6097574011, -0.7034186147,
  0.2309699292, -0.3413193965, 1.7076147010);
vec3 _helper_oklab(const in vec3 oklab) {
  vec3 lms = _helper_oklab_OKLAB2RGB_A * oklab;
  return _helper_oklab_OKLAB2RGB_B * (lms * lms * lms);
}
`
  return `vec4(_helper_oklab(vec3(${a}, ${b}, ${c})), ${alpha})`
}

export const FN_OKLAB = new FnDist("oklab")
  .add(
    ["r32", "r32", "r32"],
    "color",
    () => {
      throw new Error("Cannot compute oklab() colors outside of shaders.")
    },
    (ctx, a, b, c) => oklab(ctx, a.expr, b.expr, c.expr, "1.0"),
  )
  .add(
    ["r32", "r32", "r32", "r32"],
    "color",
    () => {
      throw new Error("Cannot compute oklab() colors outside of shaders.")
    },
    (ctx, a, b, c, alpha) => oklab(ctx, a.expr, b.expr, c.expr, alpha.expr),
  )
