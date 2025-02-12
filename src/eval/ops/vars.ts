import type { GlslValue, JsValue } from "../ty"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
  dynamic?: boolean
}

export const ERR_COORDS_USED_OUTSIDE_GLSL =
  "Cannot access pixel coordinates outside of shaders."

export const VARS: Record<string, Builtin> = {
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
