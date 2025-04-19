import { FnDist } from "@/eval/ops/dist"

export const FN_DISTANCE = new FnDist<"r32">(
  "distance",
  "calculates the distance between two objects",
)
  .add(
    ["point32", "point32"],
    "r32",
    (a, b) => a.value.sub(b.value).hypot(),
    (_, a, b) => `length(${a.expr} - ${b.expr})`,
    "distance((2,3),(5,-1))=5",
  )
  // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
  .add(
    ["line", "point32"],
    "r32",
    (a, b) => {
      const x1 = a.value[0].x
      const y1 = a.value[0].y
      const x2 = a.value[1].x
      const y2 = a.value[1].y
      const x0 = b.value.x
      const y0 = b.value.y
      const num = y2
        .sub(y1)
        .mul(x0)
        .sub(x2.sub(x1).mul(y0))
        .add(x2.mul(y1).sub(y2.mul(x1)))
        .abs()
      return num.div(a.value[0].sub(a.value[1]).hypot())
    },
    (ctx, ar, br) => {
      const a = ctx.cache(ar)
      const b = ctx.cache(br)
      const x1 = `${a}.x`
      const y1 = `${a}.y`
      const x2 = `${a}.z`
      const y2 = `${a}.w`
      const x0 = `${b}.x`
      const y0 = `${b}.y`
      return `abs((${y2} - ${y1}) * ${x0} - (${x2} - ${x1}) * ${y0} + ${x2} * ${y1} - ${y2} * ${x1}) / distance(${a}.xy, ${a}.zw)`
    },
    String.raw`distance(\operatorname{line}\left(\left(5,6\right),\left(7,-3\right)\right),(2,3))≈3.5794`,
  )
