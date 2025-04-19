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
import { declareSqrt } from "../complex"
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

const W = "with a complex number"

export default {
  name: "hyperbolic trig (complexes)",
  label: "hyperbolic trig on complex numbers",
  category: "trigonometry",
  deps: ["num/complex"],
  load() {
    FN_SINH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().sinh().s(),
      sinhGl,
      "sinh(2+3i)≈-3.591+0.531i",
    )

    FN_COSH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().cosh().s(),
      coshGl,
      "cosh(2+3i)≈-3.725+0.512i",
    )

    FN_TANH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().tanh().s(),
      tanhGl,
      "tanh(2+3i)≈0.965-0.010i",
    )

    FN_COTH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().coth().s(),
      cothGl,
      "coth(2+3i)≈1.036+0.011i",
    )

    FN_CSCH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().sinh().inv().s(),
      cschGl,
      "csch(2+3i)≈-0.273+0.040i",
    )

    FN_SECH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().cosh().inv().s(),
      sechGl,
      "sech(2+3i)≈-0.264+0.036i",
    )

    FN_ARSINH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().asinh().s(),
      (ctx, a) => {
        declareAsinh(ctx)
        return `_helper_asinh(${a.expr})`
      },
      "arsinh(2+3i)≈1.987+0.958i",
    )

    FN_ARCOSH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().acosh().s(),
      (ctx, a) => {
        declareAcosh(ctx)
        return `_helper_acosh(${a.expr})`
      },
      "arcosh(2+3i)≈6.044-1.774i",
    )

    FN_ARTANH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().atanh().s(),
      (ctx, a) => {
        declareAtanh(ctx)
        return `_helper_atanh(${a.expr})`
      },
      "artanh(2+3i)≈0.402+1.481i",
    )

    FN_ARCOTH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().acoth().s(),
      (ctx, a) => {
        declareAcoth(ctx)
        return `_helper_acoth(${a.expr})`
      },
      "arcoth(2+3i)≈0.402-0.090i",
    )

    FN_ARCSCH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().inv().asinh().s(),
      (ctx, a) => {
        declareAsinh(ctx)
        declareDiv(ctx)
        return `_helper_asinh(_helper_div(vec2(1,0), ${a.expr}))`
      },
      "arcsch(2+3i)≈0.367+0.520i",
    )

    FN_ARSECH.addRadOnly(
      W,
      ["c32"],
      "c32",
      (a) => a.value.ns().inv().acosh().s(),
      (ctx, a) => {
        declareAcosh(ctx)
        declareDiv(ctx)
        return `_helper_acosh(_helper_div(vec2(1,0), ${a.expr}))`
      },
      "arsech(2+3i)≈1.861-0.260i",
    )
  },
} satisfies Package
