import type { GlslValue, JsValue } from "../ty"
import { pt, real } from "../ty/create"
import { splitDual } from "../ty/split"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
  dynamic?: boolean
}

export const VARS: Record<string, Builtin> = {
  p: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "c64", expr: "v_coords", list: false },
    dynamic: true,
  },
  x: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "r64", expr: "v_coords.xy", list: false },
    dynamic: true,
  },
  y: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "r64", expr: "v_coords.zw", list: false },
    dynamic: true,
  },
  π: splitDual(Math.PI),
  τ: splitDual(Math.PI * 2),
  e: splitDual(Math.E),
  i: {
    js: { type: "c64", value: pt(real(0), real(1)), list: false },
    glsl: { type: "c64", expr: "vec4(0, 0, 1, 0)", list: false },
  },
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
