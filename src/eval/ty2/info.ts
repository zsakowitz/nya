import type { Tys } from "."
import type { GlslContext } from "../fn"
import { real } from "../ty/create"

export interface TyInfo<T> {
  name: string
  glsl: string
  coerce: TyCoerceMap<T>
  garbage: {
    js: T
    glsl: string
  }
}

export type TyCoerceMap<T> = {
  [K in keyof Tys]?: TyCoerce<T, Tys[K]>
}

export interface TyCoerce<T, U> {
  js(self: T): U
  glsl(self: string, ctx: GlslContext): string
}

export type TyInfoMap = {
  [K in keyof Tys]: TyInfo<Tys[K]>
}

// Types are listed in coercion order, so later declared types can only coerce
// types declared above. This isn't checked or anything, but it's a good
// heuristic to ensure we don't create any cycles.
export const TY_INFO: TyInfoMap = {
  c32: {
    name: "complex number (lowres)",
    glsl: "vec2",
    garbage: {
      js: { type: "point", x: real(NaN), y: real(NaN) },
      glsl: "vec2(0.0/0.0)",
    },
    coerce: {},
  },
  c64: {
    name: "complex number (precise)",
    glsl: "vec4",
    garbage: {
      js: { type: "point", x: real(NaN), y: real(NaN) },
      glsl: "vec4(0.0/0.0)",
    },
    coerce: {
      c32: {
        js(self) {
          return self
        },
        glsl(self) {
          return `${self}.xz`
        },
      },
    },
  },
  r32: {
    name: "real number (lowres)",
    glsl: "float",
    garbage: {
      js: real(NaN),
      glsl: "(0.0/0.0)",
    },
    coerce: {
      c32: {
        js(self) {
          return { type: "point", x: self, y: real(0) }
        },
        glsl(self) {
          return `vec2(${self}, 0)`
        },
      },
    },
  },
  r64: {
    name: "real number (precise)",
    glsl: "vec2",
    garbage: {
      js: real(NaN),
      glsl: "vec2(0.0/0.0)",
    },
    coerce: {
      r32: {
        js(self) {
          return self
        },
        glsl(self) {
          return `${self}.x`
        },
      },
      c64: {
        js(self) {
          return { type: "point", x: self, y: real(0) }
        },
        glsl(self) {
          return `vec4(${self}, vec2(0))`
        },
      },
      c32: {
        js(self) {
          return { type: "point", x: self, y: real(0) }
        },
        glsl(self) {
          return `vec2(${self}.x, 0)`
        },
      },
    },
  },
  bool: {
    name: "true/false value",
    glsl: "bool",
    garbage: {
      js: false,
      glsl: "false",
    },
    coerce: {
      r32: {
        js(self) {
          return self ? real(1) : real(NaN)
        },
        glsl(self) {
          return `(${self} ? 1.0 : 0.0/0.0)`
        },
      },
      r64: {
        js(self) {
          return self ? real(1) : real(NaN)
        },
        glsl(self) {
          return `(${self} ? vec2(1, 0) : vec2(0.0/0.0))`
        },
      },
      c32: {
        js(self) {
          return self ?
              { type: "point", x: real(1), y: real(0) }
            : { type: "point", x: real(NaN), y: real(NaN) }
        },
        glsl(self) {
          return `(${self} ? vec2(1, 0) : vec2(0.0/0.0))`
        },
      },
      c64: {
        js(self) {
          return self ?
              { type: "point", x: real(1), y: real(0) }
            : { type: "point", x: real(NaN), y: real(NaN) }
        },
        glsl(self) {
          return `(${self} ? vec4(1, 0, 0, 0) : vec4(0.0/0.0))`
        },
      },
    },
  },
  color: {
    name: "color",
    glsl: "vec4",
    garbage: {
      js: { type: "color", r: real(0), g: real(0), b: real(0), a: real(0) },
      glsl: "vec4(0.0/0.0)",
    },
    coerce: {},
  },
}

Object.setPrototypeOf(TY_INFO, null)
