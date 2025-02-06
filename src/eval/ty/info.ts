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

function lineInfo(name: string, clsx: string): TyInfo<[SPoint, SPoint]> {
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
    icon() {
      return h(
        "",
        h(
          "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-white inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(clsx),
        ),
      )
    },
  }
}

function highRes() {
  return h(
    "absolute bottom-[.5px] right-[1px] font-['Symbola'] text-[50%]/[1]",
    "+",
  )
}

function iconPoint(hd: boolean) {
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
      hd ? highRes() : null,
    ),
  )
}

function iconComplex(hd: boolean) {
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
      hd ? highRes() : null,
    ),
  )
}

function iconReal(hd: boolean) {
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
      hd ? highRes() : null,
    ),
  )
}

export const TY_INFO: TyInfoMap = {
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
    icon() {
      return iconReal(false)
    },
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
    icon() {
      return iconReal(true)
    },
  },
  c32: {
    name: "complex number",
    glsl: "vec2",
    garbage: { js: NANPT, glsl: "vec2(0.0/0.0)" },
    coerce: {},
    write: WRITE_COMPLEX,
    icon() {
      return iconComplex(false)
    },
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
    icon() {
      return iconComplex(true)
    },
  },
  point32: {
    name: "point",
    glsl: "vec2",
    garbage: { js: NANPT, glsl: "vec2(0.0/0.0)" },
    coerce: {},
    write: WRITE_POINT,
    icon() {
      return iconPoint(false)
    },
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
    icon() {
      return iconPoint(true)
    },
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
    icon() {
      return h(
        "",
        h(
          "size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] inline-block relative",
          h(
            "text-[#c74440] bg-white inline-block absolute inset-0 border-2 border-current rounded-[4px]",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            h(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Symbola'] text-[120%] mt-[1px]",
              "?",
            ),
          ),
          h(
            "text-[#388c46] bg-white inline-block absolute inset-0 border-2 border-current rounded-[4px] [clip-path:polygon(100%_100%,100%_0%,0%_100%)]",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            h(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Symbola'] text-[120%] mt-[1px]",
              "?",
            ),
          ),
        ),
      )
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
    icon() {
      function make(clsx: string) {
        return h(
          clsx,
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          palette(),
        )
      }

      function palette() {
        return h(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[18px] bg-[conic-gradient(hsl(360_100%_50%),hsl(315_100%_50%),hsl(270_100%_50%),hsl(225_100%_50%),hsl(180_100%_50%),hsl(135_100%_50%),hsl(90_100%_50%),hsl(45_100%_50%),hsl(0_100%_50%))] -rotate-90 rounded-full",
        )
      }

      return h(
        "",
        h(
          "size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] inline-block relative",
          make(
            "text-[#388c46] bg-white inline-block absolute inset-0 border-2 border-current rounded-[4px]",
          ),
          make(
            "text-[#2d70b3] bg-white inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(#000,transparent)]",
          ),
          make(
            "text-[#c74440] bg-white inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(to_right,#000,transparent)]",
          ),
          make(
            "text-[#fa7e19] bg-white inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(45deg,#000,transparent,transparent)]",
          ),
        ),
      )
    },
  },
  line32: lineInfo(
    "line",
    "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
  ),
  segment32: lineInfo(
    "segment",
    "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
  ),
  ray32: lineInfo(
    "ray",
    "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 translate-x-[-10px] translate-y-[-3.5px] border-t-2 border-current -rotate-[30deg]",
  ),
  vector32: lineInfo(
    "vector",
    "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg] after:absolute after:content-['_'] after:bg-current after:top-[-4px] after:right-[-1px] after:bottom-[-2px] after:w-[6px] after:[clip-path:polygon(0%_0%,100%_50%,0%_100%)]",
  ),
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
    icon() {
      return h(
        "",
        h(
          "text-[#388c46] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-white inline-block relative border-2 border-current rounded-[4px]",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(
            "size-[16px] absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-current",
          ),
        ),
      )
    },
  },
}

Object.setPrototypeOf(TY_INFO, null)
