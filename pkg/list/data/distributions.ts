import type { Package } from "#/types"
import { jsToGlsl } from "@/eval/glsl"
import { FnDist } from "@/eval/ops/dist"
import { FnDistDeriv } from "@/eval/ops/dist-deriv"
import { SYM_2, SYM_E, SYM_HALF, SYM_PI, unary } from "@/eval/sym"
import type { GlslValue, JsVal, SReal } from "@/eval/ty"
import { approx, gl, num, real, rept, unpt } from "@/eval/ty/create"
import { TY_INFO } from "@/eval/ty/info"
import { add, div, mul, recip, sub } from "@/eval/ty/ops"
import { CmdComma } from "@/field/cmd/leaf/comma"
import { CmdWord } from "@/field/cmd/leaf/word"
import { CmdBrack } from "@/field/cmd/math/brack"
import { Block, L, R } from "@/field/model"
import erfC32Gl from "@/glsl/erf-c32.glsl"
import erfGl from "@/glsl/erf.glsl"
import erfinvGl from "@/glsl/erfinv.glsl"
import { g, h, path, svgx } from "@/jsx"
import { defineHideable } from "@/sheet/ext/hideable"
import type { Point } from "@/sheet/point"
import { createLine } from "@/sheet/shader-line"
import erf from "@stdlib/math/base/special/erf"
import erfinv from "@stdlib/math/base/special/erfinv"
import { chain, OP_DIV, OP_JUXTAPOSE, OP_NEG, OP_RAISE } from "../core/ops"
import { EXT_EVAL } from "../eval"
import { declareMulC32, divNonSPt } from "../num/complex"
import { FN_QUANTILE } from "./statistics"

declare module "@/eval/ty" {
  interface Tys {
    normaldist: [mean: SReal, stdev: SReal]
    tdist: [degrees: SReal, shift: SReal, scale: SReal]
    poissondist: SReal
    binomialdist: [trials: SReal, chance: SReal]
    uniformdist: [min: SReal, max: SReal]
    boltzmanndist: [a: SReal]
  }
}

const normaldist = new FnDist("normaldist", "creates a normal distribution")
  .add(
    [],
    "normaldist",
    () => [real(0), real(1)],
    () => "vec2(0,1)",
    "normaldist()=normaldist(0,1)",
  )
  .add(
    ["r32"],
    "normaldist",
    (a) => [a.value, real(1)],
    (_, a) => `vec2(${a.expr}, 1)`,
    "normaldist(3)=normaldist(3,1)",
  )
  .add(
    ["r32", "r32"],
    "normaldist",
    (a, b) => [a.value, b.value],
    (_, a, b) => `vec2(${a.expr}, ${b.expr})`,
    "normaldist(3,2.7)",
  )

const tdist = new FnDist("tdist", "creates a t-distribution")
  .add(
    ["r32"],
    "tdist",
    (a) => [a.value, real(0), real(1)],
    (_, a) => `vec3(${a.expr}, 0, 1)`,
    "tdist(2.5)=tdist(2.5,0,1)",
  )
  .add(
    ["r32", "r32"],
    "tdist",
    (a, b) => [a.value, b.value, real(1)],
    (_, a, b) => `vec3(${a.expr}, ${b.expr}, 1)`,
    "tdist(2.5,3)=tdist(2.5,3,1)",
  )
  .add(
    ["r32", "r32", "r32"],
    "tdist",
    (a, b, c) => [a.value, b.value, c.value],
    (_, a, b, c) => `vec3(${a.expr}, ${b.expr}, ${c.expr})`,
    "tdist(2.5,3,7.8)",
  )

const uniformdist = new FnDist("uniformdist", "creates a uniform distribution")
  .add(
    [],
    "uniformdist",
    () => [real(0), real(1)],
    () => "vec2(0,1)",
    "uniformdist()=uniformdist(0,1)",
  )
  .add(
    ["r32"],
    "uniformdist",
    (a) => [a.value, real(1)],
    (_, a) => `vec2(${a.expr}, 1)`,
    "uniformdist(0.7)=uniformdist(0.7,1)",
  )
  .add(
    ["r32", "r32"],
    "uniformdist",
    (a, b) => [a.value, b.value],
    (_, a, b) => `vec2(${a.expr}, ${b.expr})`,
    "uniformdist(8,23)=uniformdist(8,23)",
  )

const boltzmanndist = new FnDist(
  "boltzmanndist",
  "creates a Maxwell-Boltzmann distribution",
).add(
  ["r32"],
  "boltzmanndist",
  (a) => [a.value],
  (_, a) => a.expr,
  "boltzmanndist(4.3)",
)

const poissondist = new FnDist(
  "poissondist",
  "creates a Poisson distribution",
).add(
  ["r32"],
  "poissondist",
  (a) => a.value,
  (_, a) => a.expr,
  "poissondist(2.5)",
)

const binomialdist = new FnDist(
  "binomialdist",
  "creates a binomial distribution",
)
  .add(
    ["r32"],
    "binomialdist",
    (a) => [a.value, real(0.5)],
    (_, a) => `vec2(${a.expr}, 0.5)`,
    "binomialdist(6)=binomialdist(6,0.5)",
  )
  .add(
    ["r32", "r32"],
    "binomialdist",
    (a, b) => [a.value, b.value],
    (_, a, b) => `vec2(${a.expr}, ${b.expr})`,
    "binomialdist(6,0.3)",
  )

function faddeevaPt(z: Point): Point {
  const M = 4
  const N = 1 << (M - 1)
  const A = [
    +0.983046454995208, -0.095450491368505, -0.106397537035019,
    +0.004553979597404, -0.000012773721299, -0.000000071458742,
    +0.000000000080803, -0.000000000000007,
  ]
  const B = [
    -1.338045597353875, +0.822618936152688, -0.044470795125534,
    -0.000502542048995, +0.000011914499129, -0.000000020157171,
    -0.000000000001558, +0.000000000000003,
  ]
  const C = [
    0.392699081698724, 1.178097245096172, 1.963495408493621, 2.748893571891069,
    3.534291735288517, 4.319689898685965, 5.105088062083414, 5.890486225480862,
  ]
  const s = 2.75

  // Constrain to imag(z)>=0
  const sgni = z.y < 0 ? -1 : 1
  z = { x: z.x * sgni, y: z.y * sgni }

  // Approximate
  let t: Point = { x: z.x, y: z.y + s * 0.5 }
  let w: Point = { x: 0, y: 0 }

  for (let m = 0; m < N; ++m) {
    const dw = divNonSPt(
      {
        x: A[m]! + mulPt(t, { x: 0, y: B[m]! }).x,
        y: mulPt(t, { x: 0, y: B[m]! }).y,
      },
      {
        x: C[m]! * C[m]! - sqrPt(t).x,
        y: -sqrPt(t).y,
      },
    )
    w = { x: w.x + dw.x, y: w.y + dw.y }
  }

  if (sgni < 0) {
    w = {
      x: 2 * expPt(sqrPt(z)).x - w.x,
      y: 2 * expPt(sqrPt(z)).y - w.y,
    }
  }

  return w
}

function sqrPt(z: Point): Point {
  return { x: z.x * z.x - z.y * z.y, y: 2.0 * z.x * z.y }
}

function mulPt({ x: a, y: b }: Point, { x: c, y: d }: Point): Point {
  return { x: a * c - b * d, y: b * c + a * d }
}

function expPt({ x: a, y: b }: Point): Point {
  return { x: Math.exp(a) * Math.cos(b), y: Math.exp(a) * Math.sin(b) }
}

function erfPos(z: Point): Point {
  const z_1i = mulPt({ x: 0, y: 1 }, z)
  const res = mulPt(
    expPt({
      x: -sqrPt(z).x,
      y: -sqrPt(z).y,
    }),
    faddeevaPt(z_1i),
  )
  return {
    x: 1 - res.x,
    y: -res.y,
  }
}

function erfPt(z: Point): Point {
  if (z.x < 0) {
    const res = erfPos({ x: -z.x, y: -z.y })
    return { x: -res.x, y: -res.y }
  }

  return erfPos(z)
}

const FN_ERF = new FnDist(
  "erf",
  "error function; related to area of a normal distribution",
  {
    deriv: unary((wrt, a) =>
      chain(a, wrt, {
        type: "call",
        fn: OP_JUXTAPOSE,
        args: [
          {
            type: "call",
            fn: OP_DIV,
            args: [
              SYM_2,
              {
                type: "call",
                fn: OP_RAISE,
                args: [SYM_PI, SYM_HALF],
              },
            ],
          },
          {
            type: "call",
            fn: OP_RAISE,
            args: [
              SYM_E,
              {
                type: "call",
                fn: OP_NEG,
                args: [{ type: "call", fn: OP_RAISE, args: [a, SYM_2] }],
              },
            ],
          },
        ],
      }),
    ),
  },
)
  .add(
    ["r32"],
    "r32",
    (a) => approx(erf(num(a.value))),
    (ctx, a) => {
      ctx.glslText(erfGl)
      return `_nya_helper_erf(${a.expr})`
    },
    "erf(1)≈0.842700",
  )
  .add(
    ["c32"],
    "c32",
    (a) => rept(erfPt(unpt(a.value))),
    (ctx, a) => {
      declareMulC32(ctx)
      ctx.glslText(erfC32Gl)
      return `_nya_helper_erf(${a.expr})`
    },
    "erf(2+3i)≈-20.75+8.70i",
  )
  .add(
    ["r32", "r32"],
    "r32",
    (a, b) => approx(erf(num(b.value)) - erf(num(a.value))),
    (ctx, a, b) => {
      ctx.glslText(erfGl)
      return `(_nya_helper_erf(${b.expr}) - _nya_helper_erf(${a.expr}))`
    },
    "erf(-1,1)≈1.6854",
  )
  .add(
    ["c32", "c32"],
    "c32",
    (a, b) => {
      const ap = erfPt(unpt(a.value))
      const bp = erfPt(unpt(b.value))
      return rept({ x: bp.x - ap.x, y: bp.y - ap.y })
    },
    (ctx, a, b) => {
      declareMulC32(ctx)
      ctx.glslText(erfC32Gl)
      return `(_nya_helper_erf(${b.expr}) - _nya_helper_erf(${a.expr}))`
    },
    "erf(-i,3)≈0.9976-1.6498i",
  )

const FN_FADDEEVA = new FnDist("faddeeva", "scaled complex error function").add(
  ["c32"],
  "c32",
  (a) => rept(faddeevaPt(unpt(a.value))),
  (ctx, a) => {
    declareMulC32(ctx)
    ctx.glslText(erfC32Gl)
    return `_nya_faddeeva(${a.expr})`
  },
  "faddeeva(2+3i)≈0.130+0.081i",
)

const FN_ERFINV = new FnDist("erfinv", "inverse error function").add(
  ["r32"],
  "r32",
  (a) => approx(erfinv(num(a.value))),
  (ctx, a) => {
    ctx.glslText(erfinvGl)
    return `_nya_helper_erfinv(${a.expr})`
  },
  "erf^{-1}(0.8427)≈1",
)

const FN_PDF = new FnDistDeriv("pdf", "probability distribution function")
  .add(
    ["normaldist", "r32"],
    "r32",
    (dist, xRaw) => {
      const mean = num(dist.value[0])
      const stdev = num(dist.value[1])
      const x = num(xRaw.value)
      return approx(
        Math.E ** (-((x - mean) ** 2) / (2 * stdev * stdev)) /
          Math.sqrt(2 * Math.PI * stdev * stdev),
      )
    },
    (ctx, a, b) => {
      ctx.glsl`float nya_normaldist_pdf(vec2 dist, float x) {
  float mean = dist.x;
  float variance = dist.y * dist.y;
  return pow(2.718281828459045, -(x-mean) * (x-mean) / (2.0 * variance))
    / (2.5066282746310007 * abs(dist.y));
}`
      return `nya_normaldist_pdf(${a.expr}, ${b.expr})`
    },
    "normaldist().pdf(1)≈0.24197",
  )
  .add(
    ["uniformdist", "r32"],
    "r32",
    (dist, xRaw) => {
      const min = num(dist.value[0])
      const max = num(dist.value[1])
      const x = num(xRaw.value)
      // COMPAT: desmos doesn't do an isNaN(x) check except sometimes
      // calculating uniformdist(1,2).pdf(x{x>1.5}withx=1.2) results in 1
      // but plotting uniformdist(1,2).pdf(x{x>1.5}) doesn't plot a value for x=1.2
      // to simplify things, we always do an isNaN(x) check
      // see https://www.desmos.com/calculator/x22o29smej for further examples
      if (isNaN(min) || isNaN(max) || isNaN(x) || min > max) {
        return real(NaN)
      }
      if (!isFinite(min) || !isFinite(max)) {
        return min == max ? real(NaN) : real(0)
      }
      return min <= x && x <= max ?
          recip(sub(dist.value[1], dist.value[0]))
        : real(0)
    },
    (ctx, dist, xRaw) => {
      const d = ctx.cache(dist)
      const x = ctx.cache(xRaw)
      return `(
  isnan(${d}.x) || isnan(${d}.y) || isnan(${x}) || ${d}.x > ${d}.y ? 0.0/0.0 :
  isinf(${d}.x) || isinf(${d}.y) ? ${d}.x == ${d}.y ? 0.0/0.0 : 0.0 :
  ${d}.x <= ${x} && ${x} <= ${d}.y ? 1.0 / (${d}.y - ${d}.x) : 0.0
)`
    },
    ["uniformdist(3,8).pdf(4)=\\frac15", "uniformdist(3,8).pdf(19)=0"],
  )

function uniformdistcdfGlsl(dist: string, x: string) {
  return `(
  isnan(${dist}.x) || isnan(${dist}.y) || isnan(${x}) || ${dist}.x > ${dist}.y ? 0.0/0.0
  : isinf(${dist}.x) || isinf(${dist}.y) ?
    ${dist}.x == -1.0/0.0 ? ${x} == -1.0/0.0 || ${dist}.y == 1.0/0.0 ? 0.0/0.0 : 1.0
    : ${x} == 1.0/0.0 ? 0.0/0.0 : 0.0
  : ${x} < ${dist}.x ? 0.0
  : ${x} > ${dist}.y ? 1.0
  : ${dist}.x == ${dist}.y ? 0.0/0.0
  : (${x} - ${dist}.x) / (${dist}.y - ${dist}.x)
)`
}

function uniformdistcdfJs(
  dist: JsVal<"uniformdist">,
  xRaw: JsVal<"r32">,
): SReal {
  const min = num(dist.value[0])
  const max = num(dist.value[1])
  const x = num(xRaw.value)
  // COMPAT: desmos doesn't do an isNaN(x) check except sometimes
  // calculating uniformdist(1,2).pdf(x{x>1.5}withx=1.2) results in 1
  // but plotting uniformdist(1,2).pdf(x{x>1.5}) doesn't plot a value for x=1.2
  // to simplify things, we always do an isNaN(x) check
  // see https://www.desmos.com/calculator/x22o29smej for further examples
  if (isNaN(min) || isNaN(max) || isNaN(x) || min > max) {
    return real(NaN)
  }
  if (!isFinite(min) || !isFinite(max)) {
    // COMPAT: our behavior at infinites is very different from desmos:
    // we aim that d/dx cdf = pdf, and have fewer NaN values with infinite bounds
    // nya test suite is at src/sheet/example/test/uniformdistcdf.txt
    // desmos tests are at https://www.desmos.com/calculator/wikg5utgi7
    return real(
      min == -Infinity ?
        x == -Infinity || max == Infinity ?
          NaN
        : 1
      : x == Infinity ? NaN
      : 0,
    )
  }
  // COMPAT: uniformdist(3,3).cdf(3) is 1 in desmos, but NaN in project nya
  return (
    x < min ? real(0)
    : x > max ? real(1)
    : div(sub(xRaw.value, dist.value[0]), sub(dist.value[1], dist.value[0]))
  )
}

const FN_CDF = new FnDistDeriv("cdf", "cumulative distribution function")
  .add(
    ["normaldist", "r32"],
    "r32",
    (dist, xRaw) => {
      const mean = num(dist.value[0])
      const stdev = num(dist.value[1])
      const x = num(xRaw.value)
      return approx((1 + erf((x - mean) / (stdev * Math.SQRT2))) / 2)
    },
    (ctx, dist, x) => {
      ctx.glslText(erfGl)
      const d = ctx.cache(dist)
      return `((1.0 + _nya_helper_erf((${x.expr} - ${d}.x) / (${d}.y * ${Math.SQRT2}))) / 2.0)`
    },
    "normaldist().cdf(1)≈0.8413",
  )
  // COMPAT: cdf does not automatically order its arguments
  // wrap cdf calls in absolute value signs to use dcg behavior
  .add(
    ["normaldist", "r32", "r32"],
    "r32",
    (dist, lRaw, rRaw) => {
      const mean = num(dist.value[0])
      const stdev = num(dist.value[1])
      const l = num(lRaw.value)
      const r = num(rRaw.value)
      return approx(
        (erf((r - mean) / (stdev * Math.SQRT2)) -
          erf((l - mean) / (stdev * Math.SQRT2))) /
          2,
      )
    },
    (ctx, dist, x, y) => {
      ctx.glslText(erfGl)
      const d = ctx.cache(dist)
      return `((_nya_helper_erf((${y.expr} - ${d}.x) / (${d}.y * ${Math.SQRT2})) - _nya_helper_erf((${x.expr} - ${d}.x) / (${d}.y * ${Math.SQRT2}))) / 2.0)`
    },
    "normaldist().cdf(-1,1)≈0.68",
  )
  .add(
    ["uniformdist", "r32"],
    "r32",
    uniformdistcdfJs,
    (ctx, a, b) => uniformdistcdfGlsl(ctx.cache(a), ctx.cache(b)),
    ["uniformdist(4,8).cdf(7)=0.75"],
  )
  .add(
    ["uniformdist", "r32", "r32"],
    "r32",
    (dist, lhs, rhs) =>
      sub(uniformdistcdfJs(dist, rhs), uniformdistcdfJs(dist, lhs)),
    (ctx, ar, b, c) => {
      const a = ctx.cache(ar)
      return `(${uniformdistcdfGlsl(a, ctx.cache(b))} - ${uniformdistcdfGlsl(a, ctx.cache(c))})`
    },
    ["uniformdist(4,8).cdf(7,9)=0.25"],
  )

const FN_INVERSECDF = FN_QUANTILE.with("inversecdf", FN_QUANTILE.label)

FN_QUANTILE.add(
  ["normaldist", "r32"],
  "r32",
  (dist, x) => {
    const mean = num(dist.value[0])
    const stdev = num(dist.value[1])
    const p = num(x.value)
    if (!(0 <= p && p <= 1)) return real(NaN)
    return approx(mean + stdev * Math.SQRT2 * erfinv(2 * p - 1))
  },
  (ctx, dist, x) => {
    const d = ctx.cache(dist)
    const p = ctx.cache(x)
    ctx.glslText(erfinvGl)
    return `(0.0 <= ${p} && ${p} <= 1.0 ? ${d}.x + ${d}.y * ${Math.SQRT2} * _nya_helper_erfinv(2.0 * ${p} - 1.0) : 0.0/0.0)`
  },
  ["quantile(normaldist(),.84)≈.9944"],
).add(
  ["uniformdist", "r32"],
  "r32",
  (dist, x) => {
    const p = num(x.value)
    if (!(0 <= p && p <= 1) || !(num(dist.value[0]) <= num(dist.value[1]))) {
      return real(NaN)
    }

    return add(
      mul(dist.value[0], sub(real(1), x.value)),
      mul(dist.value[1], x.value),
    )
  },
  (ctx, dist, x) => {
    const d = ctx.cache(dist)
    const p = ctx.cache(x)
    return `(0.0 <= ${p} && ${p} <= 1.0 && ${d}.x <= ${d}.y ? ${d}.x * (1.0 - ${p}) + ${d}.y * ${p} : 0.0/0.0)`
  },
  ["quantile(uniformdist(4,6),.3)=4.6"],
)

// TODO: tokens for distributions

const EXT_CONTINUOUS_DISTRIBUTION = defineHideable({
  data(expr) {
    if (!expr.js) {
      return
    }

    if (!TY_INFO[expr.js.value.type].extras?.renderContinuousPdf) {
      return
    }

    if (expr.js.value.list !== false) {
      return
    }

    return {
      eval: EXT_EVAL.data(expr)!,
      value: expr.js.value,
      expr,
    }
  },
  el(data) {
    return EXT_EVAL.el!(data.eval)
  },
  glsl(data) {
    const props = data.expr.sheet.scope.propsGlsl()
    return createLine(
      data.expr.sheet.cv,
      props,
      () => ({ list: false, type: "r64", expr: "v_coords.zw" }),
      () => {
        const dist = jsToGlsl(data.value, props.ctx)
        const x: GlslValue = { list: false, type: "r64", expr: "v_coords.xy" }
        return FN_PDF.glsl(props.ctx, [dist, x])
      },
    )
  },
})

export const PKG_DISTRIBUTIONS: Package = {
  id: "nya:distributions",
  name: "statistical distributions",
  label: null,
  category: "statistics",
  ty: {
    info: {
      normaldist: {
        name: "normal distribution",
        namePlural: "normal distributions",
        glsl: "vec2",
        toGlsl([a, b]) {
          return `vec2(${gl(a)}, ${gl(b)})`
        },
        garbage: {
          js: [real(NaN), real(NaN)],
          glsl: "vec2(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display([mean, stdev], props) {
            new CmdWord("normaldist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(mean)
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(stdev)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                svgx(
                  "-3 -4.6768178153 6 4.734125137329102",
                  "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-[.68px] size-full",
                  path(
                    "M -3 -0.05318218079999999 C -2.6666961 -0.1063596624 -2.3314068 -0.21846021599999998 -2 -0.647891604 C -1.6685932 -1.07732298 -1.3239836 -1.9629140399999998 -1 -2.90364864 C -0.67601635 -3.8443833599999997 -0.33333333 -4.78730736 0 -4.78730736 C 0.33333333 -4.78730736 0.67601635 -3.8443833599999997 1 -2.90364864 C 1.3239836 -1.9629140399999998 1.6685932 -1.07732298 2 -0.647891604 C 2.3314068 -0.21846021599999998 2.6666961 -0.1063596624 3 -0.05318218079999999",
                  ),
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        extras: { renderContinuousPdf: true },
      },
      tdist: {
        name: "t-distribution",
        namePlural: "t-distributions",
        glsl: "float",
        toGlsl(x) {
          return `vec3(${x.map(gl).join(", ")})`
        },
        garbage: {
          js: [real(NaN), real(NaN), real(NaN)],
          glsl: "vec3(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(x) {
            return x.some((x) => x.type == "approx")
          },
          display(value, props) {
            new CmdWord("tdist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(value[0])
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(value[1])
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(value[2])
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                svgx(
                  "-3 -4.6768178153 6 4.734125137329102",
                  "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-[.68px] size-full",
                  path(
                    "M -3 -0.05318218079999999 C -2.6666961 -0.1063596624 -2.3314068 -0.21846021599999998 -2 -0.647891604 C -1.6685932 -1.07732298 -1.3239836 -1.9629140399999998 -1 -2.90364864 C -0.67601635 -3.8443833599999997 -0.33333333 -4.78730736 0 -4.78730736 C 0.33333333 -4.78730736 0.67601635 -3.8443833599999997 1 -2.90364864 C 1.3239836 -1.9629140399999998 1.6685932 -1.07732298 2 -0.647891604 C 2.3314068 -0.21846021599999998 2.6666961 -0.1063596624 3 -0.05318218079999999",
                  ),
                  path(
                    "M -3 -0.238257564 C -2.6666767 -0.2693337 -2.3332784 -0.30875664 -2 -0.381390468 C -1.6667216 -0.454024284 -1.3325789 -0.539772312 -1 -0.808743228 C -0.66742112 -1.077714144 -0.33333333 -2.3697438 0 -2.3697438 C 0.33333333 -2.3697438 0.66742112 -1.077714144 1 -0.808743228 C 1.3325789 -0.539772312 1.6667216 -0.454024284 2 -0.381390468 C 2.3332784 -0.30875664 2.6666767 -0.2693337 3 -0.238257564",
                  ),
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
      uniformdist: {
        name: "uniform distribution",
        namePlural: "uniform distributions",
        glsl: "vec2",
        toGlsl([a, b]) {
          return `vec2(${gl(a)}, ${gl(b)})`
        },
        garbage: {
          js: [real(NaN), real(NaN)],
          glsl: "vec2(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display([min, max], props) {
            new CmdWord("uniformdist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(min)
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(max)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                svgx(
                  "0 0 16 16",
                  "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-2 size-full",
                  path("M 0 16 h 4"),
                  path("M 4 0 h 8"),
                  path("M 12 16 h 4"),
                  g(
                    "[stroke-dasharray:0_4]",
                    path("M 4 0 v 16"),
                    path("M 12 0 v 16"),
                  ),
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        extras: {
          renderContinuousPdf: true,
        },
      },
      boltzmanndist: {
        name: "boltzmann distribution",
        namePlural: "boltzmann distributions",
        glsl: "vec2",
        toGlsl([a]) {
          return gl(a)
        },
        garbage: {
          js: [real(NaN)],
          glsl: "(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display([mean], props) {
            new CmdWord("boltzmanndist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(mean)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-2 border-current rounded-[4px]",
              h(
                "opacity-25 block w-full h-full bg-current absolute inset-0 rounded-[2px]",
              ),
              h(
                "w-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                svgx(
                  "2 7.760000228881836 8.109999656677246 6.239999771118164",
                  "stroke-current fill-none overflow-visible [stroke-linejoin:round] [stroke-linecap:round] stroke-[1.013749957px] size-[16px]",
                  path(
                    `M2 14C2.35 13.99 2.62 12.86 2.83 11.92 2.98 11.2 3.1667 10.48 3.32 9.76 3.44 9.26 3.58 8.77 3.77 8.29 3.91 7.99 3.99 7.77 4.22 7.76 4.5 7.76 4.68 8.26 4.88 8.68 5.07 9.26 5.29 9.8 5.47 10.39 5.73 11.14 5.98 11.85 6.34 12.58 6.66 13.17 6.88 13.43 7.35 13.7 7.71 13.93 8.07 13.93 8.56 14 9.11 14 9.6 14 10.11 14`,
                  ),
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        extras: { renderContinuousPdf: true },
      },
      poissondist: {
        name: "Poisson distribution",
        namePlural: "Poisson distributions",
        glsl: "float",
        toGlsl(a) {
          return gl(a)
        },
        garbage: {
          js: real(NaN),
          glsl: "(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.type == "approx"
          },
          display(value, props) {
            new CmdWord("poissondist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(value)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
              h("opacity-25 block bg-current absolute inset-0"),
              h(
                "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                h(
                  "size-[3px] bg-current absolute rounded-full top-[9.0912045419%] left-[0%] -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-0 left-[16.7%] -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[45.000001229%] left-1/3 -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[79.8338526854%] left-1/2 -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[94.4559481245%] left-2/3 -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-[98.7792161634%] left-[83.3%] -translate-x-1/2 -translate-y-1/2",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full top-full left-full -translate-x-1/2 -translate-y-1/2",
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
      binomialdist: {
        name: "binomial distribution",
        namePlural: "binomial distributions",
        glsl: "vec2",
        toGlsl([a, b]) {
          return `vec2(${gl(a)}, ${gl(b)})`
        },
        garbage: {
          js: [real(NaN), real(NaN)],
          glsl: "vec2(0.0/0.0)",
        },
        coerce: {},
        write: {
          isApprox(value) {
            return value.some((x) => x.type == "approx")
          },
          display([a, b], props) {
            new CmdWord("binomialdist", "prefix").insertAt(props.cursor, L)
            const block = new Block(null)
            const inner = props.at(block.cursor(R))
            inner.num(a)
            new CmdComma().insertAt(inner.cursor, L)
            inner.num(b)
            new CmdBrack("(", ")", null, block).insertAt(props.cursor, L)
          },
        },
        order: null,
        point: false,
        icon() {
          return h(
            "",
            h(
              "text-[#c74440] size-[26px] mb-[2px] mx-[2.5px] align-middle text-[16px] bg-[--nya-bg] inline-block relative border-current rounded-[4px] border-2",
              h("opacity-25 block bg-current absolute inset-0"),
              h(
                "size-[16px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[100%] top-[85%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[83.3%] top-[40%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[66.6%] top-[0%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[50%] top-[11.1%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[33.3%] top-[55.6%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[16.7%] top-[88.15%]",
                ),
                h(
                  "size-[3px] bg-current absolute rounded-full -translate-x-1/2 -translate-y-1/2 left-[0%] top-[98.68%]",
                ),
              ),
            ),
          )
        },
        token: null,
        glide: null,
        preview: null,
        extras: null,
      },
    },
  },
  eval: {
    fn: {
      normaldist,
      tdist,
      boltzmanndist,
      uniformdist,
      poissondist,
      binomialdist,
      erf: FN_ERF,
      "erf^-1": FN_ERFINV, // DCG: erf^-1 is not available in standard desmos
      faddeeva: FN_FADDEEVA, // DCG: faddeeva is not available in standard desmos
      pdf: FN_PDF,
      cdf: FN_CDF,
      "cdf^-1": FN_INVERSECDF, // DCG: cdf^-1 is not available in standard desmos
      inversecdf: FN_INVERSECDF,
    },
  },
  sheet: {
    exts: {
      1: [EXT_CONTINUOUS_DISTRIBUTION],
    },
  },
}
