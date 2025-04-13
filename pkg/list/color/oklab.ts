import type { GlslContext } from "@/eval/lib/fn"

export function declareOklab(ctx: GlslContext) {
  ctx.glsl`// https://github.com/patriciogonzalezvivo/lygia/blob/main/color/space/oklab2rgb.glsl
#define SRGB_EPSILON 1e-10

float rgb2srgb(const in float c) {   return (c < 0.0031308) ? c * 12.92 : 1.055 * pow(c, 0.4166666666666667) - 0.055; }
vec3  rgb2srgb(const in vec3 rgb) {  return vec3(  rgb2srgb(rgb.r - SRGB_EPSILON), 
                                                            rgb2srgb(rgb.g - SRGB_EPSILON), 
                                                            rgb2srgb(rgb.b - SRGB_EPSILON)); }
vec4  rgb2srgb(const in vec4 rgb) {  return vec4(rgb2srgb(rgb.rgb), rgb.a); }

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
  return rgb2srgb( _helper_oklab_OKLAB2RGB_B * (lms * lms * lms));
}
`
}

export function oklab(
  ctx: GlslContext,
  a: string,
  b: string,
  c: string,
  alpha: string,
) {
  declareOklab(ctx)
  return `vec4(_helper_oklab(vec3(${a}, ${b}, ${c})), ${alpha})`
}
