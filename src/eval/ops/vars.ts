import type { GlslValue, JsValue } from "../ty"
import { real } from "../ty/create"
import { splitDual } from "../ty/split"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
  dynamic?: boolean
}

export const ERR_COORDS_USED_OUTSIDE_GLSL =
  "Cannot access pixel coordinates outside of shaders."

export const VARS: Record<string, Builtin> = {
  π: splitDual(Math.PI),
  τ: splitDual(Math.PI * 2),
  e: splitDual(Math.E),
  "∞": {
    js: { type: "r64", value: real(Infinity), list: false },
    glsl: { type: "r64", expr: "vec2(1.0/0.0)", list: false },
  },
  false: {
    js: { type: "bool", value: false, list: false },
    glsl: { type: "bool", expr: "false", list: false },
  },
  true: {
    js: { type: "bool", value: true, list: false },
    glsl: { type: "bool", expr: "true", list: false },
  },
}
Object.setPrototypeOf(VARS, null)
