import type { Package } from "."
import { fn, type GlslContext } from "../eval/lib/fn"
import type { SPoint } from "../eval/ty"
import { approx, frac, num, pt, real } from "../eval/ty/create"
import {
  addPt,
  declareDiv,
  declareLn,
  declareMulC32,
  divGl,
  divPt,
  lnJs,
  mulPt,
  PKG_NUM_COMPLEX,
  recipGl,
  recipPt,
  subPt,
} from "./num-complex"
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
  PKG_TRIG_REAL,
} from "./trig-real"

const sinGl = fn(
  ["c32"],
  "c32",
)`return vec2(sin(${0}.x) * cosh(${0}.y), cos(${0}.x) * sinh(${0}.y));`

const cosGl = fn(
  ["c32"],
  "c32",
)`return vec2(cos(${0}.x) * cosh(${0}.y), -sin(${0}.x) * sinh(${0}.y));`

const tanGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${sinGl}(${0}), ${cosGl}(${0}));`

const cscGl = fn(["c32"], "c32")`return ${recipGl}(${sinGl}(${0}));`

const secGl = fn(["c32"], "c32")`return ${recipGl}(${cosGl}(${0}));`

const cotGl = fn(
  ["c32"],
  "c32",
)`return ${divGl}(${cosGl}(${0}), ${sinGl}(${0}));`

function sinJs(a: SPoint) {
  return pt(
    approx(Math.sin(num(a.x)) * Math.cosh(num(a.y))),
    approx(Math.cos(num(a.x)) * Math.sinh(num(a.y))),
  )
}

function cosJs(a: SPoint) {
  return pt(
    approx(Math.cos(num(a.x)) * Math.cosh(num(a.y))),
    approx(-Math.sin(num(a.x)) * Math.sinh(num(a.y))),
  )
}

function tanJs(a: SPoint) {
  return divPt(sinJs(a), cosJs(a))
}

function cotJs(a: SPoint) {
  return divPt(cosJs(a), sinJs(a))
}

function sqrtJs(z: SPoint): SPoint {
  const x = num(z.x)
  const y = num(z.y)
  const h = Math.sqrt(Math.hypot(x, y))
  const a = Math.atan2(y, x) / 2
  return pt(real(Math.cos(a) * h), real(Math.sin(a) * h))
}

const I = pt(real(0), real(1))
const ONE = pt(real(1), real(0))

function asinJs(a: SPoint) {
  return mulPt(I, lnJs(subPt(sqrtJs(subPt(ONE, mulPt(a, a))), mulPt(I, a))))
}

function declareSqrt(ctx: GlslContext) {
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

function acosJs(a: SPoint) {
  return subPt(pt(real(Math.PI / 2), real(0)), asinJs(a))
}

function atanJs(a: SPoint) {
  return mulPt(pt(real(0), frac(-1, 2)), lnJs(divPt(subPt(I, a), addPt(I, a))))
}

function acotJs(a: SPoint) {
  return mulPt(pt(real(0), frac(-1, 2)), lnJs(divPt(addPt(a, I), subPt(a, I))))
}

function asecJs(a: SPoint) {
  return acosJs(recipPt(a))
}

function acscJs(a: SPoint) {
  return asinJs(recipPt(a))
}

export const PKG_TRIG_COMPLEX: Package = {
  id: "nya:trig-complex",
  name: "trigonometry on complex numbers",
  label: null,
  deps: [() => PKG_TRIG_REAL, () => PKG_NUM_COMPLEX],
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
    FN_SIN.add(["c32"], "c32", (a) => sinJs(a.value), sinGl)
    FN_COS.add(["c32"], "c32", (a) => cosJs(a.value), cosGl)
    FN_TAN.add(["c32"], "c32", (a) => tanJs(a.value), tanGl)
    FN_CSC.add(["c32"], "c32", (a) => recipPt(sinJs(a.value)), cscGl)
    FN_SEC.add(["c32"], "c32", (a) => recipPt(cosJs(a.value)), secGl)
    FN_COT.add(["c32"], "c32", (a) => cotJs(a.value), cotGl)

    FN_ARCSIN.add(
      ["c32"],
      "c32",
      (a) => asinJs(a.value),
      (ctx, a) => asinGlsl(ctx, a.expr),
    )

    FN_ARCCOS.add(
      ["c32"],
      "c32",
      (a) => acosJs(a.value),
      (ctx, a) => `(vec2(${Math.PI / 2},0) - ${asinGlsl(ctx, a.expr)})`,
    )

    FN_ARCTAN.add(
      ["c32"],
      "c32",
      (a) => atanJs(a.value),
      (ctx, a) => atanGlsl(ctx, a.expr),
    )

    FN_ARCCOT.add(
      ["c32"],
      "c32",
      (a) => acotJs(a.value),
      (ctx, a) => acotGlsl(ctx, a.expr),
    )

    FN_ARCSEC.add(
      ["c32"],
      "c32",
      (a) => asecJs(a.value),
      (ctx, a) => asecGlsl(ctx, a.expr),
    )

    FN_ARCCSC.add(
      ["c32"],
      "c32",
      (a) => acscJs(a.value),
      (ctx, a) => acscGlsl(ctx, a.expr),
    )
  },
}
