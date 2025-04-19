/*! https://en.wikipedia.org/wiki/Inverse_hyperbolic_functions */

import {
  declareDiv,
  declareLn,
  declareMulC32,
  divGl,
  recipGl,
} from "#/list/num/complex"
import type { Package } from "#/types"
import { fn, type GlslContext } from "@/eval/lib/fn"
import {
  addP,
  px,
  divP,
  lnP,
  mulP,
  recipP,
  scaleP,
  sqrP,
  sqrtP,
  subP,
} from "@/eval/ops/complex"
import { declareSqrt, divJs } from "../complex"
import {
  FN_ARCOSH,
  FN_ARCOTH,
  FN_ARCSCH,
  FN_ARSECH,
  FN_ARSINH,
  FN_ARTANH,
  FN_COSH,
  FN_COTH,
  FN_CSCH,
  FN_SECH,
  FN_SINH,
  FN_TANH,
} from "./real"

export function sinhJs(a: Point) {
  return px(Math.cos(-a.y) * Math.sinh(a.x), -Math.sin(-a.y) * Math.cosh(a.x))
}

export function coshJs(a: Point) {
  return px(Math.cos(-a.y) * Math.cosh(a.x), -Math.sin(-a.y) * Math.sinh(a.x))
}

export function tanhJs(a: Point) {
  return divJs(sinhJs(a), coshJs(a))
}

export function cothJs(a: Point) {
  return divJs(coshJs(a), sinhJs(a))
}

export const sinhGl = fn(
  ["c32"],
  "c32",
)`return vec2(-cos(-${0}.y) * sinh(${0}.x), sin(-${0}.y) * cosh(${0}.x));`

export const coshGl = fn(
  ["c32"],
  "c32",
)`return vec2(cos(-${0}.y) * cosh(${0}.x), -sin(-${0}.y) * sinh(${0}.x));`

// TODO: there are more precise ways to compute tanh and friends

export const tanhGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${sinhGl}(${0}), ${coshGl}(${0}));`

export const cschGl = fn(["c32"], "c32")`return ${recipGl}(${sinhGl}(${0}));`

export const sechGl = fn(["c32"], "c32")`return ${recipGl}(${coshGl}(${0}));`

export const cothGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${coshGl}(${0}), ${sinhGl}(${0}));`

function asinhJs(a: Point) {
  return lnP(addP(a, sqrtP(addP(sqrP(a), px(1)))))
}

function acoshJs(a: Point) {
  const p1sqrt = sqrP(addP(a, px(1)))
  const m1sqrt = sqrP(addP(a, px(-1)))
  return lnP(addP(a, mulP(p1sqrt, m1sqrt)))
}

function atanhJs(a: Point) {
  return scaleP(0.5, lnP(divP(addP(px(1), a), subP(px(1), a))))
}

function acothJs(a: Point) {
  return scaleP(0.5, lnP(divP(addP(a, px(1)), subP(a, px(1)))))
}

function declareAsinh(ctx: GlslContext) {
  declareSqrt(ctx) // _helper_sqrt
  declareLn(ctx) // _helper_ln
  declareMulC32(ctx) // _helper_mul_c32
  ctx.glsl`vec2 _helper_asinh(vec2 a) {
  return _helper_ln(
    a + _helper_sqrt(
      _helper_mul_c32(a, a) + vec2(1, 0)
    )
  );
}
`
}

function declareAcosh(ctx: GlslContext) {
  declareSqrt(ctx) // _helper_sqrt
  declareLn(ctx) // _helper_ln
  declareMulC32(ctx) // _helper_mul_c32
  ctx.glsl`vec2 _helper_acosh(vec2 a) {
  return _helper_ln(
    a + _helper_mul_c32(
      _helper_sqrt(a + vec2(1,0)),
      _helper_sqrt(a - vec2(1,0))
    )
  );
}
`
}

function declareAtanh(ctx: GlslContext) {
  declareLn(ctx) // _helper_ln
  declareDiv(ctx) // _helper_div
  ctx.glsl`vec2 _helper_atanh(vec2 a) {
  return 0.5 * _helper_ln(
    _helper_div(
      vec2(1,0) + a,
      vec2(1,0) - a
    )
  );
}
`
}

function declareAcoth(ctx: GlslContext) {
  declareLn(ctx) // _helper_ln
  declareDiv(ctx) // _helper_div
  ctx.glsl`vec2 _helper_acoth(vec2 a) {
  return 0.5 * _helper_ln(
    _helper_div(
      a + vec2(1,0),
      a - vec2(1,0)
    )
  );
}
`
}

export default {
  name: "hyperbolic trig (complexes)",
  label: "hyperbolic trig on complex numbers",
  category: "trigonometry",
  deps: ["num/complex"],
  load() {
    // FIXME: rad only

    FN_SINH.add(
      ["c32"],
      "c32",
      (a) => rept(sinhJs(a.value.xy())),
      sinhGl,
      "sinh(2+3i)≈-3.591+0.531i",
    )

    FN_COSH.add(
      ["c32"],
      "c32",
      (a) => rept(coshJs(a.value.xy())),
      coshGl,
      "cosh(2+3i)≈-3.725+0.512i",
    )

    FN_TANH.add(
      ["c32"],
      "c32",
      (a) => tanhJs(a.value.xy()),
      tanhGl,
      "tanh(2+3i)≈0.965-0.010i",
    )

    FN_COTH.add(
      ["c32"],
      "c32",
      (a) => cothJs(a.value.xy()),
      cothGl,
      "coth(2+3i)≈1.036+0.011i",
    )

    FN_CSCH.add(
      ["c32"],
      "c32",
      (a) => rept(recipP(sinhJs(a.value.xy()))),
      cschGl,
      "csch(2+3i)≈-0.273+0.040i",
    )

    FN_SECH.add(
      ["c32"],
      "c32",
      (a) => rept(recipP(coshJs(a.value.xy()))),
      sechGl,
      "sech(2+3i)≈-0.264+0.036i",
    )

    FN_ARSINH.add(
      ["c32"],
      "c32",
      (a) => rept(asinhJs(a.value.xy())),
      (ctx, a) => {
        declareAsinh(ctx)
        return `_helper_asinh(${a.expr})`
      },
      "arsinh(2+3i)≈1.987+0.958i",
    )

    FN_ARCOSH.add(
      ["c32"],
      "c32",
      (a) => rept(acoshJs(a.value.xy())),
      (ctx, a) => {
        declareAcosh(ctx)
        return `_helper_acosh(${a.expr})`
      },
      "arcosh(2+3i)≈6.044-1.774i",
    )

    FN_ARTANH.add(
      ["c32"],
      "c32",
      (a) => rept(atanhJs(a.value.xy())),
      (ctx, a) => {
        declareAtanh(ctx)
        return `_helper_atanh(${a.expr})`
      },
      "artanh(2+3i)≈0.402+1.481i",
    )

    FN_ARCOTH.add(
      ["c32"],
      "c32",
      (a) => rept(acothJs(a.value.xy())),
      (ctx, a) => {
        declareAcoth(ctx)
        return `_helper_acoth(${a.expr})`
      },
      "arcoth(2+3i)≈0.402-0.090i",
    )

    FN_ARCSCH.add(
      ["c32"],
      "c32",
      (a) => rept(asinhJs(recipP(a.value.xy()))),
      (ctx, a) => {
        declareAsinh(ctx)
        declareDiv(ctx)
        return `_helper_asinh(_helper_div(vec2(1,0), ${a.expr}))`
      },
      "arcsch(2+3i)≈0.367+0.520i",
    )

    FN_ARSECH.add(
      ["c32"],
      "c32",
      (a) => rept(acoshJs(recipP(a.value.xy()))),
      (ctx, a) => {
        declareAcosh(ctx)
        declareDiv(ctx)
        return `_helper_acosh(_helper_div(vec2(1,0), ${a.expr}))`
      },
      "arsech(2+3i)≈1.861-0.260i",
    )
  },
} satisfies Package
