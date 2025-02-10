import type { SPoint, SReal, TyComponents, TyName, Tys } from "."
import { CmdColor } from "../../field/cmd/leaf/color"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdTextInert } from "../../field/cmd/leaf/text"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h, p, svgx } from "../../jsx"
import type { Paper, Point } from "../../sheet/ui/paper"
import type { GlslContext } from "../lib/fn"
import { num, real, unpt } from "../ty/create"
import type { Write } from "./display"

export interface Garbage<T> {
  js: T
  glsl: string
}

export interface TyInfo<T, U extends TyName> {
  name: string
  namePlural: string
  glsl: string
  garbage: Garbage<T>
  coerce: TyCoerceMap<T>
  write: Write<T>
  icon(): HTMLSpanElement
  glide?(props: GlideProps<T>): { value: number; precision: number }
  components?: TyComponentInfo<T, U>
}

export interface TyComponentInfo<T, U extends TyName> {
  ty: U
  at: [(val: T) => Tys[U], (val: string) => string][]
}

export interface GlideProps<T> {
  shape: T
  point: Point
  paper: Paper
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
  [K in keyof Tys]: TyInfo<Tys[K], TyComponents[K]>
}

const WRITE_COMPLEX: Write<SPoint> = {
  isApprox(value) {
    return value.x.type == "approx" || value.y.type == "approx"
  },
  display(value, props) {
    props.nums([
      [value.x, ""],
      [value.y, "i"],
    ])
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

export function gliderOnLine(
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: [Point, Point],
  { x, y }: Point,
  paper: Paper,
) {
  const B = Math.hypot(x1 - x, y1 - y)
  const A = Math.hypot(x2 - x, y2 - y)
  const C = Math.hypot(x1 - x2, y1 - y2)

  const a = (C * C + B * B - A * A) / (2 * C)

  return {
    value: a / C,
    precision:
      paper.canvasDistance({ x: x1, y: y1 }, { x: x2, y: y2 }) /
      Math.hypot(x1 - x2, y1 - y2),
  }
}

function lineInfo(
  name: string,
  namePlural: string,
  clsx: string,
  glide: ((bound: number) => number) | null,
): TyInfo<[SPoint, SPoint], never> {
  return {
    name,
    namePlural,
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
          "text-[#2d70b3] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px] overflow-hidden",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(clsx),
        ),
      )
    },
    glide:
      glide ?
        (props) => {
          const raw = gliderOnLine(
            [unpt(props.shape[0]), unpt(props.shape[1])],
            props.point,
            props.paper,
          )

          return {
            value: glide(raw.value),
            precision: raw.precision,
          }
        }
      : undefined,
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
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
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
      "text-[#6042a6] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
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
      "text-[#000] dark:text-[#888] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px]" +
        (hd ? " border-double border-[3px]" : " border-2"),
      h(
        "opacity-25 block bg-current absolute " +
          (hd ? " -inset-[2px] rounded-[2px]" : "inset-0"),
      ),
      h(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[120%]",
        "x",
      ),
      hd ? highRes() : null,
    ),
  )
}

export function any(
  color: "text-[#fa7e19]" | "text-[#2d70b3]" = "text-[#fa7e19]",
) {
  return h(
    "",
    h(
      color +
        " size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
      h(
        "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
      ),
      h(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Symbola'] text-[120%]/[1]",
        "✨",
      ),
    ),
  )
}

export const TY_INFO: TyInfoMap = {
  bool: {
    name: "true/false value",
    namePlural: "true/false values",
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
            "text-[#c74440] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px]",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            h(
              "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-[#388c46] rounded-full",
            ),
          ),
          h(
            "text-[#388c46] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [clip-path:polygon(100%_100%,100%_0%,0%_100%)]",
            h(
              "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
            ),
            h(
              "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#c74440] rounded-full",
            ),
          ),
        ),
      )
    },
  },
  r64: {
    name: "real number",
    namePlural: "real numbers",
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
      q32: {
        js(self) {
          return [self, real(0), real(0), real(0)]
        },
        glsl(self) {
          return `vec4(${self}.x, 0, 0, 0)`
        },
      },
    },
    write: WRITE_REAL,
    icon() {
      return iconReal(true)
    },
  },
  r32: {
    name: "real number",
    namePlural: "real numbers",
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
      q32: {
        js(self) {
          return [self, real(0), real(0), real(0)]
        },
        glsl(self) {
          return `vec4(${self}, 0, 0, 0)`
        },
      },
    },
    write: WRITE_REAL,
    icon() {
      return iconReal(false)
    },
  },
  c64: {
    name: "complex number",
    namePlural: "complex numbers",
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
      q32: {
        js(self) {
          return [self.x, self.y, real(0), real(0)]
        },
        glsl(self) {
          return `vec4(${self}.xz, 0, 0)`
        },
      },
    },
    write: WRITE_COMPLEX,
    icon() {
      return iconComplex(true)
    },
    components: {
      ty: "r64",
      at: [
        [(x) => x.x, (x) => `${x}.xy`],
        [(x) => x.y, (x) => `${x}.zw`],
      ],
    },
  },
  c32: {
    name: "complex number",
    namePlural: "complex numbers",
    glsl: "vec2",
    garbage: { js: NANPT, glsl: "vec2(0.0/0.0)" },
    coerce: {
      q32: {
        js(self) {
          return [self.x, self.y, real(0), real(0)]
        },
        glsl(self) {
          return `vec4(${self}, 0, 0)`
        },
      },
    },
    write: WRITE_COMPLEX,
    icon() {
      return iconComplex(false)
    },
    components: {
      ty: "r32",
      at: [
        [(x) => x.x, (x) => `${x}.x`],
        [(x) => x.y, (x) => `${x}.y`],
      ],
    },
  },
  point64: {
    name: "point",
    namePlural: "points",
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
    components: {
      ty: "r64",
      at: [
        [(x) => x.x, (x) => `${x}.xy`],
        [(x) => x.y, (x) => `${x}.zw`],
      ],
    },
  },
  point32: {
    name: "point",
    namePlural: "points",
    glsl: "vec2",
    garbage: { js: NANPT, glsl: "vec2(0.0/0.0)" },
    coerce: {},
    write: WRITE_POINT,
    icon() {
      return iconPoint(false)
    },
    components: {
      ty: "r32",
      at: [
        [(x) => x.x, (x) => `${x}.x`],
        [(x) => x.y, (x) => `${x}.y`],
      ],
    },
  },
  q32: {
    name: "quaternion",
    namePlural: "quaternions",
    glsl: "vec4",
    garbage: {
      js: [real(NaN), real(NaN), real(NaN), real(NaN)],
      glsl: "vec4(0.0/0.0)",
    },
    coerce: {},
    write: {
      isApprox(value) {
        return (
          value[0].type == "approx" ||
          value[1].type == "approx" ||
          value[2].type == "approx" ||
          value[3].type == "approx"
        )
      },
      display(value, props) {
        props.nums([
          [value[0], ""],
          [value[1], "i"],
          [value[2], "j"],
          [value[3], "k"],
        ])
      },
    },
    icon() {
      return h(
        "",
        h(
          "text-[oklch(0.518_0.253_323.949)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Times_New_Roman'] italic text-[100%]",
            "ijk",
          ),
        ),
      )
    },
    components: {
      ty: "r32",
      at: [
        [(x) => x[0], (x) => `${x}.x`],
        [(x) => x[1], (x) => `${x}.y`],
        [(x) => x[2], (x) => `${x}.z`],
        [(x) => x[3], (x) => `${x}.w`],
      ],
    },
  },
  color: {
    name: "color",
    namePlural: "colors",
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
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[18px] bg-[conic-gradient(hsl(360_100%_50%),hsl(315_100%_50%),hsl(270_100%_50%),hsl(225_100%_50%),hsl(180_100%_50%),hsl(135_100%_50%),hsl(90_100%_50%),hsl(45_100%_50%),hsl(0_100%_50%))] -rotate-90 rounded-full dark:opacity-50",
        )
      }

      return h(
        "",
        h(
          "size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] inline-block relative",
          make(
            "text-[#388c46] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px]",
          ),
          make(
            "text-[#2d70b3] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(#000,transparent)]",
          ),
          make(
            "text-[#c74440] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(to_right,#000,transparent)]",
          ),
          make(
            "text-[#fa7e19] bg-[--nya-bg] inline-block absolute inset-0 border-2 border-current rounded-[4px] [mask-image:linear-gradient(45deg,#000,transparent,transparent)]",
          ),
        ),
      )
    },
    components: {
      ty: "r32",
      at: [
        [(x) => x.r, (x) => `(255.0 * ${x}.x)`],
        [(x) => x.g, (x) => `(255.0 * ${x}.y)`],
        [(x) => x.b, (x) => `(255.0 * ${x}.z)`],
        [(x) => x.a, (x) => `${x}.w`],
      ],
    },
  },
  segment: lineInfo(
    "line segment",
    "line segements",
    "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
    (x) => Math.max(0, Math.min(1, x)),
  ),
  ray: lineInfo(
    "ray",
    "rays",
    "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 translate-x-[-10px] translate-y-[-3.5px] border-t-2 border-current -rotate-[30deg]",
    (x) => Math.max(0, x),
  ),
  line: lineInfo(
    "line",
    "lines",
    "w-[30px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg]",
    (x) => x,
  ),
  vector: lineInfo(
    "vector",
    "vectors",
    "w-[20px] h-0 absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-current -rotate-[30deg] after:absolute after:content-['_'] after:bg-current after:top-[-4px] after:right-[-1px] after:bottom-[-2px] after:w-[6px] after:[clip-path:polygon(0%_0%,100%_50%,0%_100%)]",
    null,
  ),
  circle: {
    name: "circle",
    namePlural: "circles",
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
          "text-[#388c46] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(
            "size-[16px] absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-current",
          ),
        ),
      )
    },
    glide(props) {
      const x = num(props.shape.center.x)
      const y = num(props.shape.center.y)
      const angle =
        props.point.x == x && props.point.y == y ?
          0
        : Math.atan2(props.point.y - y, props.point.x - x)
      const circumPaper = Math.hypot(props.point.x - x, props.point.y - y)
      const circumCanvas =
        2 * Math.PI * props.paper.canvasDistance(props.point, { x, y })
      return {
        precision: circumCanvas / circumPaper,
        value: angle / 2 / Math.PI,
      }
    },
  },
  polygon: {
    name: "polygon",
    namePlural: "polygons",
    get glsl(): never {
      throw new Error("Cannot construct polygons in shaders.")
    },
    garbage: {
      js: [],
      get glsl(): never {
        throw new Error("Cannot construct polygons in shaders.")
      },
    },
    coerce: {},
    write: {
      isApprox(value) {
        return value.some((x) => x.x.type == "approx" || x.y.type == "approx")
      },
      display(value, props) {
        new CmdWord("polygon", "prefix").insertAt(props.cursor, L)
        const inner = new Block(null)
        const brack = new CmdBrack("(", ")", null, inner)
        brack.insertAt(props.cursor, L)
        let first = true
        props = props.at(inner.cursor(R))
        for (const pt of value) {
          if (first) {
            first = false
          } else {
            new CmdComma().insertAt(props.cursor, L)
          }
          const block = new Block(null)
          new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          const inner = props.at(block.cursor(R))
          inner.num(pt.x)
          new CmdComma().insertAt(inner.cursor, L)
          inner.num(pt.y)
        }
      },
    },
    icon() {
      return h(
        "",
        h(
          "text-[#388c46] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(
            "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            svgx(
              "2.2 4.4 17.6 13.2",
              "stroke-current fill-none overflow-visible [stroke-linejoin:round] stroke-2",
              p("M 7.2 4.4 L 19.8 13.2 L 2.2 17.6 Z"),
            ),
          ),
        ),
      )
    },
  },
  str: {
    name: "text",
    namePlural: "texts",
    coerce: {},
    garbage: {
      js: [],
      get glsl(): never {
        throw new Error("Arbitrary text is not supported in shaders.")
      },
    },
    get glsl(): never {
      throw new Error("Arbitrary text is not supported in shaders.")
    },
    write: {
      isApprox() {
        return false
      },
      display(value, props) {
        new CmdTextInert(
          value
            .map((x) => (x.type == "latex" ? "$" + x.value + "$" : x.value))
            .join(""),
        ).insertAt(props.cursor, L)
      },
    },
    icon() {
      return h(
        "",
        h(
          "text-[oklch(0.518_0.253_323.949)] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
          h(
            "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
          ),
          h(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-['Symbola'] text-[100%] whitespace-pre",
            "“ ”",
          ),
        ),
      )
    },
  },
}

Object.setPrototypeOf(TY_INFO, null)
