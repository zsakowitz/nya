import floorGl from "#/glsl/floor.glsl"
import type { Package } from "#/types"
import { ceilP, floorP, onP } from "@/eval/ops/complex"
import { FN_CEIL, FN_FLOOR, FN_FRACT, FN_ROUND } from "./number-theory"

export default {
  name: "complex number theory",
  label: "for complex numbers with integer components",
  category: "number theory",
  deps: ["num/real", "num/complex", "number-theory"],
  load() {
    FN_FLOOR.add(
      ["c32"],
      "c32",
      onP(floorP),
      (ctx, a) => {
        ctx.glslText(floorGl)
        return `cx_floor(${a.expr})`
      },
      "floor(-0.47+3.92i)=-1+4i",
    )

    FN_CEIL.add(
      ["c32"],
      "c32",
      onP(ceilP),
      (ctx, a) => {
        ctx.glslText(floorGl)
        return `cx_ceil(${a.expr})`
      },
      "ceil(-0.47+3.92i)=4i",
    )

    FN_ROUND.add(
      ["c32"],
      "c32",
      (a) =>
        rept({
          x: Math.round(a.value.x.num()),
          y: Math.round(a.value.y.num()),
        }),
      (_, a) => `floor(${a.expr} + 0.5)`,
      "round(2.4-3.6i)=2-4i",
    ).add(
      ["c32", "r32"],
      "c32",
      (v, places) => {
        const p = Math.round(places.value.num())
        if (p > 0) {
          const x = 10 ** p
          return pt(
            frac(Math.round(v.value.x.num() * x), x),
            frac(Math.round(v.value.y.num() * x), x),
          )
        } else {
          const x = 10 ** -p
          return pt(
            frac(x * Math.round(v.value.x.num() / x), 1),
            frac(x * Math.round(v.value.y.num() / x), 1),
          )
        }
      },
      (ctx, v, places) => {
        const p = ctx.cached("c32", `pow(vec2(10.0), ${places.expr})`)
        return `(floor(${v.expr} * ${p} + 0.5) / ${p})`
      },
      "round(2.783-4.129i,2)=2.78-4.13i",
    )
  },
  eval: {
    fn: {
      floor: FN_FLOOR,
      ceil: FN_CEIL,
      round: FN_ROUND,
      fract: FN_FRACT,
    },
  },
} satisfies Package
