import type { Package } from "."
import type { GlslContext } from "../eval/lib/fn"
import { FnDist } from "../eval/ops/dist"
import type { SColor, SReal } from "../eval/ty"
import { frac, num, real } from "../eval/ty/create"
import { TY_INFO } from "../eval/ty/info"
import { CmdColor } from "../field/cmd/leaf/color"
import { L } from "../field/model"
import { h } from "../jsx"
import { PKG_BOOL } from "./bool"
import { OP_CDOT } from "./core-ops"
import { PKG_REAL } from "./num-real"

declare module "../eval/ty" {
  interface Tys {
    color: SColor
  }

  interface TyComponents {
    color: "r32"
  }
}

const FN_RGB = new FnDist(
  "rgb",
  "creates a color given its red, green, and blue components",
)

function hsv(hr: SReal, sr: SReal, vr: SReal, a: SReal): SColor {
  const h = num(hr) / 360
  const s = num(sr)
  const v = num(vr)

  // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
  let r, g, b
  let i = Math.floor(h * 6)
  let f = h * 6 - i
  let p = v * (1 - s)
  let q = v * (1 - f * s)
  let t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0:
      ;(r = v), (g = t), (b = p)
      break
    case 1:
      ;(r = q), (g = v), (b = p)
      break
    case 2:
      ;(r = p), (g = v), (b = t)
      break
    case 3:
      ;(r = p), (g = q), (b = v)
      break
    case 4:
      ;(r = t), (g = p), (b = v)
      break
    case 5:
      ;(r = v), (g = p), (b = q)
      break
    default:
      throw new Error("Never occurs.")
  }
  return {
    type: "color",
    r: real(255.0 * r),
    g: real(255.0 * g),
    b: real(255.0 * b),
    a,
  }
}

function declareHsv(ctx: GlslContext) {
  ctx.glsl`const vec4 _helper_hsv_const = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);

vec3 _helper_hsv(vec3 c) {
  vec3 p = abs(fract(c.xxx + _helper_hsv_const.xyz) * 6.0 - _helper_hsv_const.www);
  return c.z * mix(_helper_hsv_const.xxx, clamp(p - _helper_hsv_const.xxx, 0.0, 1.0), c.y);
}
`
}

const FN_HSV = new FnDist(
  "hsv",
  "creates a color given its hue (0-360), saturation (0-1), and value (0-1)",
)

export function plotJs(): never {
  throw new Error("Cannot plot colors outside of a shader.")
}

export const OP_PLOT = new FnDist<"color">(
  "plot",
  "converts an expression to the color it plots as a shader",
)

export const PKG_COLOR_CORE: Package = {
  id: "nya:color-core",
  name: "color functions core",
  label: "rgb and hsv functions",
  deps: [() => PKG_REAL, () => PKG_BOOL],
  load() {
    OP_PLOT.add(
      ["bool"],
      "color",
      plotJs,
      (_, a) =>
        `(${a.expr} ? vec4(0.1764705882, 0.4392156863, 0.7019607843, 1) : vec4(0))`,
    )

    FN_RGB.add(
      ["r32", "r32", "r32"],
      "color",
      (r, g, b) => ({
        type: "color",
        r: r.value,
        g: g.value,
        b: b.value,
        a: real(1),
      }),
      (_, r, g, b) => `vec4(vec3(${r.expr}, ${g.expr}, ${b.expr}) / 255.0, 1)`,
    ).add(
      ["r32", "r32", "r32", "r32"],
      "color",
      (r, g, b, a) => ({
        type: "color",
        r: r.value,
        g: g.value,
        b: b.value,
        a: a.value,
      }),
      (_, r, g, b, a) =>
        `vec4(vec3(${r.expr}, ${g.expr}, ${b.expr}) / 255.0, ${a.expr})`,
    )

    FN_HSV.add(
      ["r32", "r32", "r32"],
      "color",
      (hr, sr, vr) => hsv(hr.value, sr.value, vr.value, frac(1, 1)),
      (ctx, hr, sr, vr) => {
        declareHsv(ctx)
        return `vec4(_helper_hsv(vec3(${hr.expr} / 360.0, ${sr.expr}, ${vr.expr})), 1)`
      },
    ).add(
      ["r32", "r32", "r32", "r32"],
      "color",
      (hr, sr, vr, ar) => hsv(hr.value, sr.value, vr.value, ar.value),
      (ctx, hr, sr, vr, ar) => {
        declareHsv(ctx)
        return `vec4(_helper_hsv(vec3(${hr.expr} / 360.0, ${sr.expr}, ${vr.expr})), ${ar.expr})`
      },
    )

    OP_PLOT.add(["color"], "color", plotJs, (_, a) => a.expr).add(
      ["r32"],
      "color",
      plotJs,
      (ctx, a) =>
        FN_HSV.glsl1(
          ctx,
          a,
          { type: "r32", expr: "1.0" },
          { type: "r32", expr: "1.0" },
        ).expr,
    )

    OP_CDOT.add(
      ["color", "bool"],
      "color",
      (a, b) => (b.value ? a.value : TY_INFO.color.garbage.js),
      (_, a, b) => `(${b.expr} ? ${a.expr} : ${TY_INFO.color.garbage.glsl})`,
    ).add(
      ["bool", "color"],
      "color",
      (b, a) => (b.value ? a.value : TY_INFO.color.garbage.js),
      (_, b, a) => `(${b.expr} ? ${a.expr} : ${TY_INFO.color.garbage.glsl})`,
    )
  },
  ty: {
    info: {
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
              const v = Math.min(255, Math.max(0, Math.floor(num(x)))).toString(
                16,
              )
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
    },
  },
  eval: {
    fns: {
      rgb: FN_RGB,
      hsv: FN_HSV,
    },
  },
}
