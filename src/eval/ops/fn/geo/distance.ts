import type { Point } from "../../../../sheet/ui/paper"
import type { SPoint, SReal } from "../../../ty"
import { num, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { abs } from "../../op/abs"
import { add } from "../../op/add"
import { div } from "../../op/div"
import { mul } from "../../op/mul"
import { sub } from "../../op/sub"

export function sqrt(val: SReal) {
  return real(num(val) ** 0.5)
}

export function dist(a: SPoint, b: SPoint) {
  const dx = sub(a.x, b.x)
  const dy = sub(a.y, b.y)
  const dx2 = mul(dx, dx)
  const dy2 = mul(dy, dy)
  return sqrt(add(dx2, dy2))
}

export function distLinePt(
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: [Point, Point],
  { x: x0, y: y0 }: Point,
) {
  const num = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + (x2 * y1 - y2 * x1))
  return num / Math.hypot(x1 - x2, y1 - y2)
}

export function distCirclePt(center: Point, radius: Point, pt: Point) {
  const x = pt.x - center.x
  const y = pt.y - center.y
  const angle = Math.atan2((y / radius.y) * radius.x, x)
  const r = Math.hypot(Math.cos(angle) * radius.x, Math.sin(angle) * radius.y)
  return Math.abs(Math.hypot(pt.x - center.x, pt.y - center.y) - r)
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
