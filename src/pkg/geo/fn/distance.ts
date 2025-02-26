import { FnDist } from "../../../eval/ops/dist"
import type { SPoint, SReal } from "../../../eval/ty"
import { num, pt, real } from "../../../eval/ty/create"
import { abs, add, div, mul, sub } from "../../../eval/ty/ops"

export function sqrt(val: SReal) {
  return real(num(val) ** 0.5)
}

export function hypot({ x: dx, y: dy }: SPoint) {
  const dx2 = mul(dx, dx)
  const dy2 = mul(dy, dy)
  return sqrt(add(dx2, dy2))
}

export function dist(a: SPoint, b: SPoint) {
  return hypot(pt(sub(a.x, b.x), sub(a.y, b.y)))
}

export const FN_DISTANCE = new FnDist<"r32">(
  "distance",
  "calculates the distance between two objects",
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
      const num = abs(
        add(
          sub(mul(sub(y2, y1), x0), mul(sub(x2, x1), y0)),
          sub(mul(x2, y1), mul(y2, x1)),
        ),
      )
      return div(num, dist(a.value[0], a.value[1]))
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
  )
  .add(
    ["point32", "point32"],
    "r32",
    (a, b) => dist(a.value, b.value),
    (ctx, ar, br) => {
      const a = ctx.cache(ar)
      const b = ctx.cache(br)
      return `hypot(${a}.x - ${b}.x, ${a}.y - ${b}.y)`
    },
  )
