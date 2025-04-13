import { FnDist } from "@/eval/ops/dist"
import { frac, num, real } from "@/eval/ty/create"
import { div, sub } from "@/eval/ty/ops"
import { isDark } from "@/sheet/theme"
import type { Package } from "#/types"
import { FN_VALID } from "../bool"
import { PKG_COLOR_CORE } from "./core"
import { oklab } from "./oklab"

const FN_OKLAB = new FnDist(
  "oklab",
  "creates a color given its lightness, green-red, and blue-yellow components",
)

const FN_OKLCH = new FnDist(
  "oklch",
  "creates a color given its lightness, chromaticity, and hue components",
)

const FN_R = new FnDist(".r", "gets the red component of a color")
const FN_G = new FnDist(".g", "gets the green component of a color")
const FN_B = new FnDist(".b", "gets the blue component of a color")
const FN_A = new FnDist(".a", "gets the alpha component of a color")

// const FN_HSL = new FnDist(
//   "hsl",
//   "creates a color from hue, saturation, and lightness components",
// )

// TODO: hsl
// H\left(h,s,l\right)=\operatorname{hsv}\left(h,\left\{v=0:0,2\left(1-\frac{l}{v}\right)\right\},v\right)\operatorname{with}v=l+s\operatorname{min}\left(l,1-l\right)

const FN_LIGHTDARK = new FnDist(
  "lightdark",
  "if a single color is passed, it will be inverted in dark mode; if two arguments are passed, the first is used for light mode and the second for dark mode",
)
  .add(
    ["color"],
    "color",
    (a) => {
      if (isDark()) {
        return {
          type: "color",
          r: sub(frac(255, 0), a.value.r),
          g: sub(frac(255, 0), a.value.g),
          b: sub(frac(255, 0), a.value.b),
          a: a.value.a,
        }
      } else return a.value
    },
    (ctx, ar) => {
      const a = ctx.cache(ar)
      return `(u_darkmul * ${a} + u_darkoffset)`
    },
    "lightdark(rgb(4,70,196))",
  )
  .add(
    ["color", "color"],
    "color",
    (a, b) => (isDark() ? b.value : a.value),
    (_, a, b) => {
      return `(u_is_dark ? ${b.expr} : ${a.expr})`
    },
    "lightdark(rgb(4,70,196),hsv(60,1,0.7))",
  )

export const PKG_COLOR_EXTRAS: Package = {
  id: "nya:color-extras",
  name: "color functions extended",
  label: "more functions for creating colors",
  category: "color",
  deps: [() => PKG_COLOR_CORE],
  load() {
    FN_VALID.add(
      ["color"],
      "bool",
      ({ value: c }) => {
        const r = num(c.r)
        const g = num(c.g)
        const b = num(c.b)
        const a = num(c.a)
        return (
          0 <= r &&
          r <= 255 &&
          0 <= g &&
          g <= 255 &&
          0 <= b &&
          b <= 255 &&
          0 <= a &&
          a <= 1
        )
      },
      (ctx, ar) => {
        const a = ctx.cache(ar)
        return `(0.0 <= ${a}.x && ${a}.x <= 1.0 && 0.0 <= ${a}.y && ${a}.y <= 1.0 && 0.0 <= ${a}.z && ${a}.z <= 1.0 && 0.0 <= ${a}.w && ${a}.w <= 1.0)`
      },
      "valid(rgb(8,900,-350))=false",
    )

    FN_OKLCH.add(
      ["r32", "r32", "r32"],
      "color",
      () => {
        throw new Error("Cannot compute oklch() colors outside of shaders.")
      },
      (ctx, l, cr, hr) => {
        const h = ctx.name()
        ctx.push`float ${h} = ${hr.expr} / 360.0 * ${2 * Math.PI};\n`
        const c = ctx.name()
        ctx.push`float ${c} = ${cr.expr};\n`
        return oklab(
          ctx,
          l.expr,
          `(${c} * cos(${h}))`,
          `(${c} * sin(${h}))`,
          "1.0",
        )
      },
      "oklch(0.69,0.1661,50)=\\nyacolor{#eb7829}",
    ).add(
      ["r32", "r32", "r32", "r32"],
      "color",
      () => {
        throw new Error("Cannot compute oklch() colors outside of shaders.")
      },
      (ctx, l, cr, hr, a) => {
        const h = ctx.name()
        ctx.push`float ${h} = ${hr.expr} / 360.0 * ${2 * Math.PI};\n`
        const c = ctx.name()
        ctx.push`float ${c} = ${cr.expr};\n`
        return oklab(
          ctx,
          l.expr,
          `(${c} * cos(${h}))`,
          `(${c} * sin(${h}))`,
          a.expr,
        )
      },
      "oklch(0.69,0.1661,50,.5)=\\nyacolor{#eb782980}",
    )

    FN_OKLAB.add(
      ["r32", "r32", "r32"],
      "color",
      () => {
        throw new Error("Cannot compute oklab() colors outside of shaders.")
      },
      (ctx, a, b, c) => oklab(ctx, a.expr, b.expr, c.expr, "1.0"),
      "oklab(0.8,-0.083,-0.144)=\\nyacolor{rgb(57,202,255)}",
    ).add(
      ["r32", "r32", "r32", "r32"],
      "color",
      () => {
        throw new Error("Cannot compute oklab() colors outside of shaders.")
      },
      (ctx, a, b, c, alpha) => oklab(ctx, a.expr, b.expr, c.expr, alpha.expr),
      "oklab(0.8,-0.083,-0.144,.5)=\\nyacolor{rgb(57,202,255 / 50%)}",
    )

    FN_R.add(
      ["color"],
      "r32",
      (a) => div(a.value.r, real(255)),
      (_, a) => `${a.expr}.x`,
      "rgb(23,45,250).r=\\frac{23}{255}",
    )

    FN_G.add(
      ["color"],
      "r32",
      (a) => div(a.value.g, real(255)),
      (_, a) => `${a.expr}.y`,
      "rgb(23,45,250).g=\\frac{45}{255}",
    )

    FN_B.add(
      ["color"],
      "r32",
      (a) => div(a.value.b, real(255)),
      (_, a) => `${a.expr}.z`,
      "rgb(23,45,250).r=\\frac{250}{255}",
    )

    FN_A.add(
      ["color"],
      "r32",
      (a) => a.value.a,
      (_, a) => `${a.expr}.w`,
      "rgb(23,45,250,0.3).a=0.3",
    )
  },
  eval: {
    fn: {
      valid: FN_VALID,
      oklab: FN_OKLAB,
      oklch: FN_OKLCH,
      lightdark: FN_LIGHTDARK,
      ".r": FN_R,
      ".g": FN_G,
      ".b": FN_B,
      ".a": FN_A,
    },
  },
}
