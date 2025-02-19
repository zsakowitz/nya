import type { Package } from "."
import type { GlslContext } from "../eval/lib/fn"
import { FnDist } from "../eval/ops/dist"
import { FN_FIRSTVALID } from "../eval/ops/fn/firstvalid"
import { FN_VALID } from "../eval/ops/fn/valid"
import { sub } from "../eval/ops/op/sub"
import { frac, num } from "../eval/ty/create"
import { TY_INFO } from "../eval/ty/info"
import { isDark } from "../sheet/theme"
import { PKG_COLOR_CORE } from "./color-core"

function oklab(
  ctx: GlslContext,
  a: string,
  b: string,
  c: string,
  alpha: string,
) {
  ctx.glsl`// https://github.com/patriciogonzalezvivo/lygia/blob/main/color/space/oklab2rgb.glsl
const mat3 _helper_oklab_OKLAB2RGB_A = mat3(
  1.0,           1.0,           1.0,
  0.3963377774, -0.1055613458, -0.0894841775,
  0.2158037573, -0.0638541728, -1.2914855480);
const mat3 _helper_oklab_OKLAB2RGB_B = mat3(
  4.0767416621, -1.2684380046, -0.0041960863,
  -3.3077115913, 2.6097574011, -0.7034186147,
  0.2309699292, -0.3413193965, 1.7076147010);
vec3 _helper_oklab(const in vec3 oklab) {
  vec3 lms = _helper_oklab_OKLAB2RGB_A * oklab;
  return _helper_oklab_OKLAB2RGB_B * (lms * lms * lms);
}
`
  return `vec4(_helper_oklab(vec3(${a}, ${b}, ${c})), ${alpha})`
}

const FN_OKLAB = new FnDist(
  "oklab",
  "creates a color given its lightness, green-red, and blue-yellow components",
)

const FN_OKLCH = new FnDist(
  "oklch",
  "creates a color given its lightness, chromaticity, and hue components",
)

export const PKG_COLOR_EXTRAS: Package = {
  id: "nya:color-extras",
  name: "color functions extended",
  label: "more functions for creating colors",
  deps: [() => PKG_COLOR_CORE],
  init() {
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
    )

    FN_FIRSTVALID.addSpread(
      "color",
      "color",
      (args) => {
        for (const arg of args) {
          if (FN_VALID.js1({ type: "color", value: arg }).value) {
            return arg
          }
        }
        return TY_INFO.color.garbage.js
      },
      (ctx, ...args) => {
        return (
          args
            .map((arg) => {
              const a = ctx.cache(arg)
              return `${FN_VALID.glsl1(ctx, { type: "color", expr: a }).expr} ? ${a} : `
            })
            .join("") + TY_INFO.color.garbage.glsl
        )
      },
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
    )

    FN_OKLAB.add(
      ["r32", "r32", "r32"],
      "color",
      () => {
        throw new Error("Cannot compute oklab() colors outside of shaders.")
      },
      (ctx, a, b, c) => oklab(ctx, a.expr, b.expr, c.expr, "1.0"),
    ).add(
      ["r32", "r32", "r32", "r32"],
      "color",
      () => {
        throw new Error("Cannot compute oklab() colors outside of shaders.")
      },
      (ctx, a, b, c, alpha) => oklab(ctx, a.expr, b.expr, c.expr, alpha.expr),
    )
  },
  eval: {
    fns: {
      valid: FN_VALID,
      oklab: FN_OKLAB,
      oklch: FN_OKLCH,
      lightdark: new FnDist(
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
        )
        .add(
          ["color", "color"],
          "color",
          (a, b) => (isDark() ? b.value : a.value),
          (_, a, b) => {
            return `(u_is_dark ? ${b.expr} : ${a.expr})`
          },
        ),
      firstvalid: FN_FIRSTVALID,
    },
  },
}
