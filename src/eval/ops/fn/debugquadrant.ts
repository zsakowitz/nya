import { FnDist } from "../../fn/dist"
import { frac, num, real } from "../../ty/create"

export const FN_DEBUGQUADRANT = new FnDist("debugquadrant").add(
  ["c32"],
  "color",
  (a) => {
    return {
      type: "color",
      r: real((255 * (Math.sign(num(a.value.x)) + 1)) / 2),
      g: real((255 * (Math.sign(num(a.value.y)) + 1)) / 2),
      b: frac(255, 1),
      a: frac(1, 1),
    }
  },
  (ctx, a) => {
    ctx.glsl`vec4 _helper_debugquadrant_c32(vec2 z) {
  return vec4(
    sign(v_coords.x - z.x) / 2.0 + 0.5,
    sign(v_coords.z - z.y) / 2.0 + 0.5,
    1,
    1
  );
}
`
    return `_helper_debugquadrant_c32(${a.expr})`
  },
)
