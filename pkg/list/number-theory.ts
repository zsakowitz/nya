import type { Package } from "#/types"
import { FnDist } from "@/eval/ops/dist"
import { frac } from "@/lib/real"

export const FN_FLOOR = new FnDist(
  "floor",
  "rounds down to the nearest integer",
).add(
  ["r32"],
  "r32",
  (v) => v.value.floor(),
  (_, v) => `floor(${v.expr})`,
  ["floor(2.3)=2", "floor(-7.8)=-8"],
)

export const FN_FRACT = new FnDist(
  "fract",
  "calculate x-floor(x), or the fractional part of x",
).add(
  ["r32"],
  "r32",
  (v) => v.value.fract(),
  (_, v) => `fract(${v.expr})`,
  ["fract(7.4)=0.4", "fract(-9.3)=0.7"],
)

export const FN_CEIL = new FnDist(
  "ceil",
  "rounds up to the nearest integer",
).add(
  ["r32"],
  "r32",
  (v) => v.value.ceil(),
  (_, v) => `ceil(${v.expr})`,
  ["ceil(2.3)=3", "ceil(-7.8)=-7"],
)

export const FN_ROUND = new FnDist(
  "round",
  "rounds to the nearest integer; ties are rounded up",
)
  .add(
    ["r32"],
    "r32",
    (v) => v.value.round(),
    (_, v) => `floor(${v.expr} + 0.5)`,
    ["round(3.5)=4", "round(-3.8)=-4"],
  )
  .add(
    ["r32", "r32"],
    "r32",
    (v, places) => {
      const p = Math.round(places.value.num())
      if (p > 0) {
        const x = 10 ** p
        return frac(Math.round(v.value.num() * x), x)
      } else {
        const x = 10 ** -p
        return frac(x * Math.round(v.value.num() / x), 1)
      }
    },
    (ctx, v, places) => {
      const p = ctx.cached("r32", `pow(10.0, ${places.expr})`)
      return `(floor(${v.expr} * ${p} + 0.5) / ${p})`
    },
    ["round(395.92143,2)=395.92", "round(395.92143,-2)=400"],
  )

export default {
  name: "number theory",
  label: "functions for working with integers",
  category: "number theory",
  deps: ["num/real"],
  eval: {
    fn: {
      floor: FN_FLOOR,
      ceil: FN_CEIL,
      round: FN_ROUND,
      fract: FN_FRACT,
    },
  },
} satisfies Package
