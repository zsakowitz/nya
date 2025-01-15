import { pt, real } from "../ty/create"
import type { GlslValue, JsValue } from "../ty2"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
}

function split(x: number) {
  const high = new Float32Array([x])[0]!
  const low = x - high
  return `vec2(${high.toPrecision()}, ${low.toPrecision()})`
}

export const VARS: Record<string, Builtin> = {
  p: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "c64", expr: "v_coords", list: false },
  },
  x: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "r64", expr: "v_coords.xy", list: false },
  },
  y: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "r64", expr: "v_coords.zw", list: false },
  },
  π: {
    js: { type: "r64", value: real(Math.PI), list: false },
    glsl: { type: "r64", expr: split(Math.PI), list: false },
  },
  τ: {
    js: { type: "r64", value: real(2 * Math.PI), list: false },
    glsl: { type: "r64", expr: split(2 * Math.PI), list: false },
  },
  e: {
    js: { type: "r64", value: real(Math.E), list: false },
    glsl: { type: "r64", expr: split(Math.E), list: false },
  },
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
