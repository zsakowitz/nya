import erfC32Gl from "#/glsl/erf-c32.glsl"
import type { Package } from "#/types"
import { cx, type Complex } from "@/lib/complex"
import { declareMulC32 } from "../num/complex"
import { FN_ERF } from "./erf"

export function faddeevaPt(z: Complex): Complex {
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
  z = cx(z.x * sgni, z.y * sgni)

  // Approximate
  let t = cx(z.x, z.y + s * 0.5)
  let w = cx(0, 0)

  for (let m = 0; m < N; ++m) {
    // TODO: optimize all the zeroes out
    const dw = cx(A[m]! + t.mul(cx(0, B[m]!)).x, t.mul(cx(0, B[m]!)).y).div(
      cx(C[m]! * C[m]! - t.square().x, -t.square().y),
    )
    w = cx(w.x + dw.x, w.y + dw.y)
  }

  if (sgni < 0) {
    const ze = z.square().exp()
    w = cx(2 * ze.x - w.x, 2 * ze.y - w.y)
  }

  return w
}

function erfPos(z: Complex): Complex {
  const z_1i = z.mulI()
  const res = cx(-z.square().x, -z.square().y).exp().mul(faddeevaPt(z_1i))
  return cx(1 - res.x, -res.y)
}

function erfPt(z: Complex): Complex {
  if (z.x < 0) {
    const res = erfPos(cx(-z.x, -z.y))
    return cx(-res.x, -res.y)
  }

  return erfPos(z)
}

FN_ERF.add(
  ["c32"],
  "c32",
  (a) => erfPt(a.value.ns()).s(),
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
    const ap = erfPt(a.value.ns())
    const bp = erfPt(b.value.ns())
    return cx(bp.x - ap.x, bp.y - ap.y).s()
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
