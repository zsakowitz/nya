import { FnDist } from "../../dist"

export const FN_DISTANCE = new FnDist<"r32">("distance")
  // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
  .add(
    ["line32", "point32"],
    "r32",
    (a, b) => {
      throw new Error("not yet lmao")
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
      return `abs((${y2} - ${y1}) * ${x0} - (${x2} - ${x1}) * ${y0} + ${x2} * ${y1} + ${y2} * ${x1}) / length(vec2(${y2} - ${y1}, ${x2} - ${x1}))`
    },
  )
