import type { Package } from "#/types"
import {
  declareDiv,
  declareLn,
  declareMulC32,
  divGl,
  recipGl,
} from "$/num/complex"
import { fn, type GlslContext } from "@/eval/lib/fn"
import type { RequireRadiansReason } from "@/sheet/ui/sheet"
import {
  FN_ARCCOS,
  FN_ARCCOT,
  FN_ARCCSC,
  FN_ARCSEC,
  FN_ARCSIN,
  FN_ARCTAN,
  FN_COS,
  FN_COT,
  FN_CSC,
  FN_SEC,
  FN_SIN,
  FN_TAN,
} from "./real"

export const sinGl = fn(
  ["c32"],
  "c32",
)`return vec2(sin(${0}.x) * cosh(${0}.y), cos(${0}.x) * sinh(${0}.y));`

export const cosGl = fn(
  ["c32"],
  "c32",
)`return vec2(cos(${0}.x) * cosh(${0}.y), -sin(${0}.x) * sinh(${0}.y));`

export const tanGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${sinGl}(${0}), ${cosGl}(${0}));`

export const cscGl = fn(["c32"], "c32")`return ${recipGl}(${sinGl}(${0}));`

export const secGl = fn(["c32"], "c32")`return ${recipGl}(${cosGl}(${0}));`

export const cotGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${cosGl}(${0}), ${sinGl}(${0}));`

export function declareSqrt(ctx: GlslContext) {
  ctx.glsl`vec2 _helper_sqrt(vec2 z) {
  float a = atan(z.y, z.x) / 2.0;
  return vec2(cos(a), sin(a)) * sqrt(length(z));
}
`
}

function declareAsin(ctx: GlslContext) {
  declareSqrt(ctx) // _helper_sqrt
  declareLn(ctx) // _helper_ln
  declareMulC32(ctx) // _helper_mul_c32
  ctx.glsl`vec2 _helper_asin(vec2 a) {
  return _helper_ln(
    _helper_sqrt(vec2(1, 0) - _helper_mul_c32(a, a))
      - a.yx * vec2(-1, 1)
  ).yx * vec2(-1, 1);
}
`
}

function declareAtan(ctx: GlslContext) {
  declareLn(ctx) // _helper_ln
  declareDiv(ctx) // _helper_div
  ctx.glsl`vec2 _helper_atan(vec2 a) {
  return _helper_ln(
    _helper_div(
      vec2(0, 1) - a,
      vec2(0, 1) + a
    )
  ).yx * vec2(0.5, -0.5);
}
`
}

function declareAcot(ctx: GlslContext) {
  declareLn(ctx) // _helper_ln
  declareDiv(ctx) // _helper_div
  ctx.glsl`vec2 _helper_acot(vec2 a) {
  return _helper_ln(
    _helper_div(
      a + vec2(0, 1),
      a - vec2(0, 1)
    )
  ).yx * vec2(0.5, -0.5);
}
`
}

function asinGlsl(ctx: GlslContext, a: string): string {
  declareAsin(ctx)
  return `_helper_asin(${a})`
}

function atanGlsl(ctx: GlslContext, a: string): string {
  declareAtan(ctx)
  return `_helper_atan(${a})`
}

function acotGlsl(ctx: GlslContext, a: string): string {
  declareAcot(ctx)
  return `_helper_acot(${a})`
}

function asecGlsl(ctx: GlslContext, a: string): string {
  declareAsin(ctx)
  declareDiv(ctx)
  return `(vec2(${Math.PI / 2}, 0) - _helper_asin(_helper_div(vec2(1, 0), ${a})))`
}

function acscGlsl(ctx: GlslContext, a: string): string {
  declareAsin(ctx)
  declareDiv(ctx)
  return `_helper_asin(_helper_div(vec2(1, 0), ${a}))`
}

export default {
  name: "complex trig",
  label: null,
  category: "trigonometry",
  deps: ["trig/real", "num/complex"],
  eval: {
    fn: {
      sin: FN_SIN,
      cos: FN_COS,
      tan: FN_TAN,
      csc: FN_CSC,
      sec: FN_SEC,
      cot: FN_COT,
    },
  },
  load() {
    const Q: RequireRadiansReason = "with a complex number"

    FN_SIN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().sin().s(),
      sinGl,
      "sin(2+3i)≈9.1545-4.1689i",
    )

    FN_COS.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().cos().s(),
      cosGl,
      "cos(2+3i)≈-4.1896-9.1092i",
    )

    FN_TAN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().tan().s(),
      tanGl,
      "tan(2+3i)≈-0.0038+1.0032i",
    )

    FN_CSC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().sin().inv().s(),
      cscGl,
      "csc(2+3i)≈0.0905+0.0412i",
    )

    FN_SEC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().cos().inv().s(),
      secGl,
      "sec(2+3i)≈-0.0417+0.0906i",
    )

    FN_COT.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().cot().s(),
      cotGl,
      "cot(2+3i)≈-0.0037-0.9968i",
    )

    FN_ARCSIN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().asin().s(),
      (ctx, a) => asinGlsl(ctx, a.expr),
      "arcsin(2+3i)≈0.5707+1.9834i",
    )

    FN_ARCCOS.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().acos().s(),
      (ctx, a) => `(vec2(${Math.PI / 2},0) - ${asinGlsl(ctx, a.expr)})`,
      "arccos(2+3i)≈1.0001-1.9834i",
    )

    FN_ARCTAN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().atan().s(),
      (ctx, a) => atanGlsl(ctx, a.expr),
      "arctan(2+3i)≈1.4099+0.2291i",
    )

    FN_ARCCOT.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().inv().atan().s(), // TODO: dedicated acot
      (ctx, a) => acotGlsl(ctx, a.expr),
      "arccot(2+3i)≈0.1609-0.2291i",
    )

    FN_ARCSEC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().inv().acos().s(),
      (ctx, a) => asecGlsl(ctx, a.expr),
      "arcsec(2+3i)≈1.4204+0.2313i",
    )

    FN_ARCCSC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => a.value.ns().inv().asin().s(),
      (ctx, a) => acscGlsl(ctx, a.expr),
      "arccsc(2+3i)≈0.1504-0.2313i",
    )
  },
} satisfies Package
