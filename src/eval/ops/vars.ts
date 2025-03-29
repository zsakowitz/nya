import type { GlslValue, JsValue } from "../ty"
import { approx } from "../ty/create"
import type { Display } from "../ty/display"
import { splitRaw } from "../ty/split"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
  dynamic?: boolean
  display: boolean | ((display: Display) => void)
  label: string
}

export const ERR_COORDS_USED_OUTSIDE_GLSL =
  "Cannot access pixel coordinates outside of shaders."

// SHAPE: consistent shape
export const VARS: Record<string, Builtin> = Object.create(null)
VARS["°"] = {
  js: { type: "r64", list: false, value: approx(Math.PI / 180) },
  glsl: {
    type: "r64",
    list: false,
    expr: `vec2(${splitRaw(Math.PI / 180).join(", ")})`,
  },
  display: true,
  label: "conversion factor from degrees to radians",
}
