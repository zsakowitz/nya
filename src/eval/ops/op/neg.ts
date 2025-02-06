import type { SReal } from "../../ty"
import { approx, frac, pt } from "../../ty/create"
import { FnDist } from "../dist"

export function neg(a: SReal): SReal {
  return a.type == "exact" ? frac(-a.n, a.d) : approx(-a.value)
}

export const OP_NEG = new FnDist("-", "negates its input")
  .add(
    ["r64"],
    "r64",
    (a) => neg(a.value),
    (_, a) => `(-${a.expr})`,
  )
  .add(
    ["r32"],
    "r32",
    (a) => neg(a.value),
    (_, a) => `(-${a.expr})`,
  )
  .add(
    ["c64"],
    "c64",
    (a) => pt(neg(a.value.x), neg(a.value.y)),
    (_, a) => `(-${a.expr})`,
  )
  .add(
    ["c32"],
    "c32",
    (a) => pt(neg(a.value.x), neg(a.value.y)),
    (_, a) => `(-${a.expr})`,
  )
  .add(
    ["point64"],
    "point64",
    (a) => pt(neg(a.value.x), neg(a.value.y)),
    (_, a) => `(-${a.expr})`,
  )
  .add(
    ["point32"],
    "point32",
    (a) => pt(neg(a.value.x), neg(a.value.y)),
    (_, a) => `(-${a.expr})`,
  )
