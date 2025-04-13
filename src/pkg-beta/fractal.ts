import type { Package } from "#/types"
import { PKG_NUM_COMPLEX } from "$/num-complex"
import { defineExt, Prop } from "@/sheet/ext"

export type Theme = "simple" | "gradient" | "plot" | "trig" | "black" | "none"

export type InnerTheme = "black" | "gradient" | "plot" | "blobs"

export interface OuterThemeInfo {
  readonly id: number
  readonly a?: string | undefined
  readonly b?: string | undefined
  readonly c?: string | undefined
}

export interface InnerThemeInfo {
  readonly id: number
  readonly a?: string | undefined
  readonly b?: string | undefined
}

export const themeMap: Record<Theme, OuterThemeInfo> = {
  simple: {
    id: 1,
    a: "split out",
    c: "darkness",
  },
  gradient: {
    id: 2,
    a: "split out",
    c: "darkness",
  },
  plot: {
    id: 3,
    c: "darkness",
  },
  trig: {
    id: 4,
    a: "alts a",
    b: "alts b",
    c: "darkness",
  },
  black: {
    id: 5,
    a: "white",
    b: "glow",
  },
  none: {
    id: 6,
  },
}

export const innerThemeMap: Record<InnerTheme, InnerThemeInfo> = {
  black: {
    id: 1,
    a: "white",
  },
  gradient: {
    id: 2,
    a: "split in",
  },
  plot: {
    id: 3,
  },
  blobs: {
    id: 4,
    a: "alts a",
    b: "alts b",
  },
}

const opts = new Prop<{
  theme: Theme
  innerTheme: InnerTheme
  outerA: boolean
  outerB: boolean
  outerC: boolean
  innerA: boolean
  innerB: boolean

  detail: number
  minDetail: number
  fractalSize: number
  plotSize: 1
}>(() => ({
  theme: "simple",
  innerTheme: "black",
  outerA: false,
  outerB: false,
  outerC: false,
  innerA: false,
  innerB: false,

  detail: 100,
  minDetail: 0,
  fractalSize: 2,
  plotSize: 1,
}))

const EXT_FRACTAL = defineExt({
  data(expr) {
    if (
      !(
        expr.field.ast.type == "op" &&
        expr.field.ast.kind == "\\to " &&
        expr.field.ast.b &&
        expr.field.ast.a.type == "var" &&
        !expr.field.ast.a.sub &&
        !expr.field.ast.a.sup &&
        expr.field.ast.a.kind == "var" &&
        expr.field.ast.a.value == "z"
      )
    ) {
      return
    }

    return { expr, node: expr.field.ast.b }
  },
  plotGl(data, helpers): undefined {
    const props = data.expr.sheet.scope.propsGlsl()
    // const value = OP_PLOT.glsl(props.ctx, glsl(ast, props))
    // if (value.list !== false) {
    //   throw new Error("Shaders must return a single color.")
    // }
    // return [props.ctx, value.expr]
  },
})

export const PKG_FRACTAL: Package = {
  id: "fractal",
  name: "fractal explorer integration",
  label:
    "allows expressions like z->z²+c to generate fractals using standard fractal explorer options",
  deps: [() => PKG_NUM_COMPLEX],

  sheet: {
    exts: {
      1: [EXT_FRACTAL],
    },
  },
}
