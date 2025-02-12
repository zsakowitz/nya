import type { GlslContext } from "../../lib/fn"
import { FnDist } from "../dist"

export const FN_DEBUGPOINT = new FnDist(
  "debugpoint",
  "given some point p, returns a color depending on which side of the currently active shader pixel that point p is on",
)

export function declareDebugPoint(
  ctx: GlslContext,
  a: { type: "c32" | "point32"; expr: string },
): string {
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
