import type { GlslValue, JsValue } from "./ty"
import { pt, real } from "./ty/create"

export interface Builtin {
  js: JsValue
  glsl: GlslValue
}

export const BUILTINS = {
  __proto__: null,
  p: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "complex", expr: "v_coords", list: false },
  },
  x: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "real", expr: "v_coords.x", list: false },
  },
  y: {
    get js(): never {
      throw new Error("Cannot access pixel coordinates outside of shaders.")
    },
    glsl: { type: "real", expr: "v_coords.y", list: false },
  },
  π: {
    js: { type: "real", value: real(Math.PI), list: false },
    glsl: { type: "real", expr: Math.PI + "", list: false },
  },
  τ: {
    js: { type: "real", value: real(2 * Math.PI), list: false },
    glsl: { type: "real", expr: 2 * Math.PI + "", list: false },
  },
  e: {
    js: { type: "real", value: real(Math.E), list: false },
    glsl: { type: "real", expr: Math.E + "", list: false },
  },
  i: {
    js: { type: "complex", value: pt(real(0), real(1)), list: false },
    glsl: { type: "complex", expr: "vec2(0, 1)", list: false },
  },
  "∞": {
    js: { type: "real", value: real(Infinity), list: false },
    glsl: { type: "real", expr: "(1.0/0.0)", list: false },
  },
  false: {
    js: { type: "bool", value: false, list: false },
    glsl: { type: "bool", expr: "false", list: false },
  },
  true: {
    js: { type: "bool", value: true, list: false },
    glsl: { type: "bool", expr: "true", list: false },
  },
} satisfies Record<string, Builtin | null> as any as Record<string, Builtin>
