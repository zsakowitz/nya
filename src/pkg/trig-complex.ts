import type { Package } from "."
import type { GlslContext } from "../eval/lib/fn"
import type { SPoint } from "../eval/ty"
import { approx, num, pt } from "../eval/ty/create"
import { declareDiv, divPt, PKG_NUM_COMPLEX } from "./num-complex"
import { FN_COS, FN_SIN, FN_TAN, PKG_TRIG_REAL } from "./trig-real"

function declareSin(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_sin(vec2 z) {
  return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}
`
}

function sinJs(a: SPoint) {
  return pt(
    approx(Math.sin(num(a.x)) * Math.cosh(num(a.y))),
    approx(Math.cos(num(a.x)) * Math.sinh(num(a.y))),
  )
}

function declareCos(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_cos(vec2 z) {
  return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}
`
}

function cosJs(a: SPoint): SPoint {
  return pt(
    approx(Math.cos(num(a.x)) * Math.cosh(num(a.y))),
    approx(-Math.sin(num(a.x)) * Math.sinh(num(a.y))),
  )
}

export const PKG_TRIG_COMPLEX: Package = {
  id: "nya:trig-complex",
  name: "trigonometry on complex numbers",
  label: null,
  deps: [() => PKG_TRIG_REAL, () => PKG_NUM_COMPLEX],
  eval: {
    fns: {
      sin: FN_SIN,
      cos: FN_COS,
      tan: FN_TAN,
    },
  },
  init() {
    FN_SIN.add(
      ["c32"],
      "c32",
      (a) => sinJs(a.value),
      (ctx, a) => {
        declareSin(ctx)
        return `_helper_sin(${a})`
      },
    )

    FN_COS.add(
      ["c32"],
      "c32",
      (a) => cosJs(a.value),
      (ctx, a) => {
        declareCos(ctx)
        return `_helper_cos(${a})`
      },
    )

    FN_TAN.add(
      ["c32"],
      "c32",
      (a) => divPt(sinJs(a.value), cosJs(a.value)),
      (ctx, a) => {
        declareDiv(ctx)
        declareSin(ctx)
        declareCos(ctx)
        // TODO: this probably has lots of redundant terms
        ctx.glsl`vec2 _helper_tan(vec2 a) {
  return _helper_div(_helper_sin(a), _helper_cos(a));
}
`
        return `_helper_tan(${a.expr})`
      },
    )
  },
}
