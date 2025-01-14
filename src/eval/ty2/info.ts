import type { Tys } from "."
import type { GlslContext } from "../fn"
import { real } from "../ty/create"

export interface TyInfo<T> {
  name: string
  glsl: string
  coerce: TyCoerceMap<T>
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
    name: "complex number",
    glsl: "vec2",
    coerce: {},
  },
  c64: {
    name: "complex number",
    glsl: "vec4",
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
    name: "real number",
    glsl: "float",
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
    name: "real number",
    glsl: "vec2",
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
    coerce: {},
  },
}

Object.setPrototypeOf(TY_INFO, null)
