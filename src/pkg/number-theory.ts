import type { Package } from "."
import { FnDist } from "../eval/ops/dist"
import { frac, num } from "../eval/ty/create"
import { PKG_REAL } from "./num-real"

const floor = new FnDist("floor", "rounds down to the nearest integer").add(
  ["r32"],
  "r32",
  (v) => frac(Math.floor(num(v.value)), 1),
  (_, v) => `floor(${v.expr})`,
)

const ceil = new FnDist("ceil", "rounds up to the nearest integer").add(
  ["r32"],
  "r32",
  (v) => frac(Math.ceil(num(v.value)), 1),
  (_, v) => `ceil(${v.expr})`,
)

const round = new FnDist(
  "round",
  "rounds to the nearest integer; ties are rounded up",
)
  .add(
    ["r32"],
    "r32",
    (v) => frac(Math.round(num(v.value)), 1),
    (_, v) => `floor(${v.expr} + 0.5)`,
  )
  .add(
    ["r32", "r32"],
    "r32",
    (v, places) => {
      const p = Math.round(num(places.value))
      if (p > 0) {
        const x = 10 ** p
        return frac(Math.round(num(v.value) * x), x)
      } else {
        const x = 10 ** -p
        return frac(x * Math.round(num(v.value) / x), 1)
      }
    },
    (ctx, v, places) => {
      const p = ctx.cached("r32", `pow(10.0, ${places.expr})`)
      return `(floor(${v.expr} * ${p} + 0.5) / ${p})`
    },
  )

export const PKG_NUMBER_THEORY: Package = {
  id: "nya:number-theory",
  name: "number theory",
  label: "functions for working with integers",
  deps: [() => PKG_REAL],
  eval: {
    fns: {
      floor,
      ceil,
      round,
    },
  },
}
