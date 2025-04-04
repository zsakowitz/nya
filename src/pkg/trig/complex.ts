import { fn, type GlslContext } from "@/eval/lib/fn"
import type { SPoint } from "@/eval/ty"
import { approx, frac, num, pt, real, rept, unpt } from "@/eval/ty/create"
import type { Point } from "@/sheet/point"
import type { RequireRadiansReason } from "@/sheet/ui/sheet"
import type { Package } from ".."
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
} from "../num/complex"
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
} from "./real"

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

function sinJs(a: Point) {
  return {
    x: Math.sin(a.x) * Math.cosh(a.y),
    y: Math.cos(a.x) * Math.sinh(a.y),
  }
}

function cosJs(a: Point) {
  return {
    x: Math.cos(a.x) * Math.cosh(a.y),
    y: -Math.sin(a.x) * Math.sinh(a.y),
  }
}

function tanJs(a: Point) {
  return divJs(sinJs(a), cosJs(a))
}

function cotJs(a: Point) {
  return divJs(cosJs(a), sinJs(a))
}

function recipJs({ x: c, y: d }: Point): SPoint {
  const denom = c * c + d * d
  if (denom == 0) return pt(approx(1 / c), approx(1 / d))
  return pt(approx(c / denom), approx(d / denom))
}

function divJs({ x: a, y: b }: Point, { x: c, y: d }: Point): SPoint {
  const x = a * c + b * d
  const y = b * c - a * d
  const denom = c * c + d * d
  return pt(approx(x / denom), approx(y / denom))
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
  name: "on complex numbers",
  label: null,
  category: "trigonometry",
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
    const Q: RequireRadiansReason = "with a complex number"

    FN_SIN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => rept(sinJs(unpt(a.value))),
      sinGl,
      "sin(2+3i)≈9.1545-4.1689i",
    )

    FN_COS.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => rept(cosJs(unpt(a.value))),
      cosGl,
      "cos(2+3i)≈-4.1896-9.1092i",
    )

    FN_TAN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => tanJs(unpt(a.value)),
      tanGl,
      "tan(2+3i)≈-0.0038+1.0032i",
    )

    FN_CSC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => recipJs(sinJs(unpt(a.value))),
      cscGl,
      "csc(2+3i)≈0.0905+0.0412i",
    )

    FN_SEC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => recipJs(cosJs(unpt(a.value))),
      secGl,
      "sec(2+3i)≈-0.0417+0.0906i",
    )

    FN_COT.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => cotJs(unpt(a.value)),
      cotGl,
      "cot(2+3i)≈-0.0037-0.9968i",
    )

    FN_ARCSIN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => asinJs(a.value),
      (ctx, a) => asinGlsl(ctx, a.expr),
      "arcsin(2+3i)≈0.5707+1.9834i",
    )

    FN_ARCCOS.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => acosJs(a.value),
      (ctx, a) => `(vec2(${Math.PI / 2},0) - ${asinGlsl(ctx, a.expr)})`,
      "arccos(2+3i)≈1.0001-1.9834i",
    )

    FN_ARCTAN.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => atanJs(a.value),
      (ctx, a) => atanGlsl(ctx, a.expr),
      "arctan(2+3i)≈1.4099+0.2291i",
    )

    FN_ARCCOT.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => acotJs(a.value),
      (ctx, a) => acotGlsl(ctx, a.expr),
      "arccot(2+3i)≈0.1609-0.2291i",
    )

    FN_ARCSEC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => asecJs(a.value),
      (ctx, a) => asecGlsl(ctx, a.expr),
      "arcsec(2+3i)≈1.4204+0.2313i",
    )

    FN_ARCCSC.addRadOnly(
      Q,
      ["c32"],
      "c32",
      (a) => acscJs(a.value),
      (ctx, a) => acscGlsl(ctx, a.expr),
      "arccsc(2+3i)≈0.1504-0.2313i",
    )
  },
}
