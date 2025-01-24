import type { GlslContext } from "../../lib/fn"
import type { GlslVal, JsVal, SColor } from "../../ty"
import { frac, num, real } from "../../ty/create"
import { FnDist } from "../dist"

function js(a: JsVal<"c32" | "point32">): SColor {
  return {
    type: "color",
    r: real((255 * (Math.sign(num(a.value.x)) + 1)) / 2),
    g: real((255 * (Math.sign(num(a.value.y)) + 1)) / 2),
    b: frac(255, 1),
    a: frac(1, 1),
  }
}

function glsl(ctx: GlslContext, a: GlslVal<"c32" | "point32">): string {
  ctx.glsl`vec4 _helper_debugpoint_c32(vec2 z) {
  return vec4(
    sign(v_coords.x - z.x) / 2.0 + 0.5,
    sign(v_coords.z - z.y) / 2.0 + 0.5,
    1,
    1
  );
}
`
  return `_helper_debugpoint_c32(${a.expr})`
}

export const FN_DEBUGPOINT = new FnDist("debugpoint")
  .add(["c32"], "color", js, glsl)
  .add(["point32"], "color", js, glsl)
