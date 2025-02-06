import type { SPoint, SReal, Tys } from "."
import { CmdColor } from "../../field/cmd/leaf/color"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h } from "../../jsx"
import type { Paper } from "../../sheet/ui/paper"
import type { GlslContext } from "../lib/fn"
import { num, real } from "../ty/create"
import type { Write } from "./display"

export interface Garbage<T> {
  js: T
  glsl: string
}

export interface TyInfo<T> {
  name: string
  glsl: string
  garbage: Garbage<T>
  coerce: TyCoerceMap<T>
  write: Write<T>
  icon(): HTMLSpanElement
}

export interface Plot<T> {
  canvas(value: T, paper: Paper): void
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

const WRITE_COMPLEX: Write<SPoint> = {
  isApprox(value) {
    return value.x.type == "approx" || value.y.type == "approx"
  },
  display(value, props) {
    props.complex(value)
  },
}

const WRITE_REAL: Write<SReal> = {
  isApprox(value) {
    return value.type == "approx"
  },
  display(value, props) {
    props.num(value)
  },
}

const WRITE_POINT: Write<SPoint> = {
  isApprox(value) {
    return value.x.type == "approx" || value.y.type == "approx"
  },
  display(value, props) {
    const block = new Block(null)
    new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
    const inner = props.at(block.cursor(R))
    inner.num(value.x)
    new CmdComma().insertAt(inner.cursor, L)
    inner.num(value.y)
  },
}

const NANPT: SPoint = { type: "point", x: real(NaN), y: real(NaN) }

function lineInfo(name: string): TyInfo<[SPoint, SPoint]> {
  return {
    name,
    glsl: "vec4",
    garbage: { js: [NANPT, NANPT], glsl: "vec4(0.0/0.0)" },
    coerce: {},
    write: {
      isApprox(value) {
        return value.some((x) => x.x.type == "approx" || x.y.type == "approx")
      },
      display(value, props) {
        new CmdWord(name, "prefix").insertAt(props.cursor, L)
        const block = new Block(null)
        new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
        const inner = props.at(block.cursor(R))
        WRITE_POINT.display(value[0], inner)
        new CmdComma().insertAt(inner.cursor, L)
        WRITE_POINT.display(value[1], inner)
      },
    },
  }
}

function iconPoint() {
  return h(
    "",
    h(
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-white inline-block relative border-2 border-current rounded-[4px]",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "size-[7px] bg-current absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      ),
    ),
  )
}

function iconComplex() {
  return h(
    "",
    h(
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-white inline-block relative border-2 border-current rounded-[4px]",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[120%]",
        "i",
      ),
    ),
  )
}

function iconReal() {
  return h(
    "",
    h(
      "text-[#000] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-white inline-block relative border-2 border-current rounded-[4px]",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[120%]",
        "x",
      ),
    ),
  )
}

// Types are listed in coercion order, so later declared types can only coerce
// types declared above. This isn't checked or anything, but it's a good
// heuristic to ensure we don't create any cycles.
export const TY_INFO: TyInfoMap = {
  c32: {
    name: "complex number",
    glsl: "vec2",
    garbage: { js: NANPT, glsl: "vec2(0.0/0.0)" },
    coerce: {},
    write: WRITE_COMPLEX,
    icon: iconComplex,
  },
  c64: {
    name: "complex number",
    glsl: "vec4",
    garbage: { js: NANPT, glsl: "vec4(0.0/0.0)" },
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
    write: WRITE_COMPLEX,
    icon: iconComplex,
  },
  r32: {
    name: "real number",
    glsl: "float",
    garbage: { js: real(NaN), glsl: "(0.0/0.0)" },
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
    write: WRITE_REAL,
    icon: iconReal,
  },
  r64: {
    name: "real number",
    glsl: "vec2",
    garbage: { js: real(NaN), glsl: "vec2(0.0/0.0)" },
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
    write: WRITE_REAL,
    icon: iconReal,
  },
  bool: {
    name: "true/false value",
    glsl: "bool",
    garbage: { js: false, glsl: "false" },
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
          return self ? { type: "point", x: real(1), y: real(0) } : NANPT
        },
        glsl(self) {
          return `(${self} ? vec2(1, 0) : vec2(0.0/0.0))`
        },
      },
      c64: {
        js(self) {
          return self ? { type: "point", x: real(1), y: real(0) } : NANPT
        },
        glsl(self) {
          return `(${self} ? vec4(1, 0, 0, 0) : vec4(0.0/0.0))`
        },
      },
    },
    write: {
      isApprox() {
        return false
      },
      display(value, props) {
        new CmdWord("" + value, "var").insertAt(props.cursor, L)
      },
    },
  },
  color: {
    name: "color",
    glsl: "vec4",
    garbage: {
      js: { type: "color", r: real(0), g: real(0), b: real(0), a: real(0) },
      glsl: "vec4(0)",
    },
    coerce: {},
    write: {
      isApprox(value) {
        return (
          value.r.type == "approx" ||
          value.g.type == "approx" ||
          value.b.type == "approx" ||
          value.a.type == "approx"
        )
      },
      display(value, props) {
        const f = (x: SReal) => {
          const v = Math.min(255, Math.max(0, Math.floor(num(x)))).toString(16)
          if (v.length == 1) return "0" + v
          return v
        }

        new CmdColor("#" + f(value.r) + f(value.g) + f(value.b)).insertAt(
          props.cursor,
          L,
        )
      },
    },
  },
  point32: {
    name: "point",
    glsl: "vec2",
    garbage: { js: NANPT, glsl: "vec2(0.0/0.0)" },
    coerce: {},
    write: WRITE_POINT,
    icon: iconPoint,
  },
  point64: {
    name: "point",
    glsl: "vec4",
    garbage: { js: NANPT, glsl: "vec4(0.0/0.0)" },
    coerce: {
      point32: {
        js(self) {
          return self
        },
        glsl(self) {
          return `${self}.xz`
        },
      },
    },
    write: WRITE_POINT,
    icon: iconPoint,
  },
  line32: lineInfo("line"),
  segment32: lineInfo("segment"),
  ray32: lineInfo("ray"),
  vector32: lineInfo("vector"),
  circle32: {
    name: "circle",
    glsl: "vec3",
    garbage: {
      js: { center: NANPT, radius: real(NaN) },
      glsl: "vec3(0.0/0.0)",
    },
    coerce: {},
    write: {
      isApprox(value) {
        return (
          value.center.x.type == "approx" ||
          value.center.y.type == "approx" ||
          value.radius.type == "approx"
        )
      },
      display(value, props) {
        new CmdWord("circle", "prefix").insertAt(props.cursor, L)
        const block = new Block(null)
        new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
        const inner = props.at(block.cursor(R))
        WRITE_POINT.display(value.center, inner)
        new CmdComma().insertAt(inner.cursor, L)
        inner.num(value.radius)
      },
    },
  },
}

Object.setPrototypeOf(TY_INFO, null)
