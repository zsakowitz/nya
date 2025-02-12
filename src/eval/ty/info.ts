import type { SPoint, SReal, TyComponents, TyName, Tys } from "."
import { CmdColor } from "../../field/cmd/leaf/color"
import { CmdComma } from "../../field/cmd/leaf/comma"
import { CmdWord } from "../../field/cmd/leaf/word"
import { CmdBrack } from "../../field/cmd/math/brack"
import { Block, L, R } from "../../field/model"
import { h } from "../../jsx"
import type { Paper, Point } from "../../sheet/ui/paper"
import type { GlslContext } from "../lib/fn"
import { num, real } from "../ty/create"
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

const WRITE_REAL: Write<SReal> = {
  isApprox(value) {
    return value.type == "approx"
  },
  display(value, props) {
    props.num(value)
  },
}

export const WRITE_POINT: Write<SPoint> = {
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

export function highRes() {
  return h(
    "absolute bottom-[.5px] right-[1px] font-['Symbola'] text-[50%]/[1]",
    "+",
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
    coerce: {},
    write: WRITE_REAL,
    icon() {
      return iconReal(false)
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
} satisfies Partial<TyInfoMap> as any as TyInfoMap

Object.setPrototypeOf(TY_INFO, null)
