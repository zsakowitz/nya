import erfC32Gl from "#/glsl/erf-c32.glsl"
import type { Package } from "#/types"
import { divP, expP, mulP, sqrP } from "@/eval/ops/complex"
import { rept, unpt } from "@/eval/ty/create"
import type { Point } from "@/sheet/point"
import { declareMulC32 } from "../num/complex"
import { FN_ERF } from "./erf"

export function faddeevaPt(z: Point): Point {
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
    const dw = divP(
      {
        x: A[m]! + mulP(t, { x: 0, y: B[m]! }).x,
        y: mulP(t, { x: 0, y: B[m]! }).y,
      },
      {
        x: C[m]! * C[m]! - sqrP(t).x,
        y: -sqrP(t).y,
      },
    )
    w = { x: w.x + dw.x, y: w.y + dw.y }
  }

  if (sgni < 0) {
    w = { x: 2 * expP(sqrP(z)).x - w.x, y: 2 * expP(sqrP(z)).y - w.y }
  }

  return w
}

function erfPos(z: Point): Point {
  const z_1i = mulP({ x: 0, y: 1 }, z)
  const res = mulP(
    expP({
      x: -sqrP(z).x,
      y: -sqrP(z).y,
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

FN_ERF.add(
  ["c32"],
  "c32",
  (a) => rept(erfPt(unpt(a.value))),
  (ctx, a) => {
    declareMulC32(ctx)
    ctx.glslText(erfC32Gl)
    return `_nya_helper_erf(${a.expr})`
  },
  "erf(2+3i)≈-20.75+8.70i",
).add(
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

export default {
  name: "complex error function",
  label: null,
  category: "numbers (multi-dimensional)",
  deps: ["special/erf", "num/complex"],
  eval: {
    fn: {
      erf: FN_ERF,
    },
  },
} satisfies Package
