import type { GlslValue, JsValue } from "../ty"
import type { Display } from "../ty/display"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
  dynamic?: boolean
  display: boolean | ((display: Display) => void)
  label: string
  word?: boolean
}

export const ERR_COORDS_USED_OUTSIDE_GLSL =
  "Cannot access pixel coordinates outside of shaders."

// SHAPE: consistent shape
export const VARS: Record<string, Builtin> = Object.create(null)
