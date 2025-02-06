import type { GlslContext } from "../../../lib/fn"
import type { GlslVal, Tys, Val } from "../../../ty"
import { num, pt, real } from "../../../ty/create"
import { FnDist } from "../../dist"
import { div } from "../../op/div"
import { mul } from "../../op/mul"
import { sub } from "../../op/sub"

function js(
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: Val<"line32">,
  [{ x: x3, y: y3 }, { x: x4, y: y4 }]: Val<"line32">,
) {
  return pt(
    div(
      // (x1 y2 - y1 x2) (x3 - x4) - (x1 - x2) (x3 y4 - y3 x4)
      sub(
        // (x1 y2 - y1 x2) (x3 - x4)
        mul(sub(mul(x1, y2), mul(y1, x2)), sub(x3, x4)),
        // (x1 - x2) (x3 y4 - y3 x4)
        mul(sub(x1, x2), sub(mul(x3, y4), mul(y3, x4))),
      ),
      // (x1 - x2) (y3 - y4) - (y1 - y2) (x3 - x4)
      sub(mul(sub(x1, x2), sub(y3, y4)), mul(sub(y1, y2), sub(x3, x4))),
    ),

    div(
      // (x1 y2 - y1 x2) (y3 - y4) - (x1 - x2) (x3 y4 - y3 x4)
      sub(
        // (x1 y2 - y1 x2) (y3 - y4)
        mul(sub(mul(x1, y2), mul(y1, x2)), sub(y3, y4)),
        // (y1 - y2) (x3 y4 - y3 x4)
        mul(sub(y1, y2), sub(mul(x3, y4), mul(y3, x4))),
      ),
      // (x1 - x2) (y3 - y4) - (y1 - y2) (x3 - x4)
      sub(mul(sub(x1, x2), sub(y3, y4)), mul(sub(y1, y2), sub(x3, x4))),
    ),
  )
}

function glsl(ctx: GlslContext, ar: GlslVal, br: GlslVal): string {
  const a = ctx.cache(ar)
  const b = ctx.cache(br)

  const x1 = `${a}.x`
  const y1 = `${a}.y`
  const x2 = `${a}.z`
  const y2 = `${a}.w`
  const x3 = `${b}.x`
  const y3 = `${b}.y`
  const x4 = `${b}.z`
  const y4 = `${b}.w`

  return `vec2(
  (${x1} * ${y2} - ${y1} * ${x2}) * (${x3} - ${x4}) - (${x1} - ${x2}) * (${x3} * ${y4} - ${y3} - ${x4}),
  (${x1} * ${y2} - ${y1} * ${x2}) * (${y3} - ${y4}) - (${y1} - ${y2}) * (${x3} * ${y4} - ${y3} - ${x4})
) / ((${x1} - ${x2}) * (${y3} - ${y4}) - (${y1} - ${y2}) * (${x3} - ${x4}))`
}

export const FN_INTERSECTION = new FnDist(
  "intersection",
  "constructs the point where two objects intersect",
)

for (const a of ["line32", "ray32", "segment32", "vector32"] as const) {
  for (const b of ["line32", "ray32", "segment32", "vector32"] as const) {
    FN_INTERSECTION.add([a, b], "point32", (a, b) => js(a.value, b.value), glsl)
  }
}

function intersect(circ: Tys["circle32"], lin: Tys["line32"], index: 0 | 1) {
  // https://stackoverflow.com/a/37225895
  const circle = {
    center: { x: num(circ.center.x), y: num(circ.center.y) },
    radius: num(circ.radius),
  }
  const line = {
    p1: { x: num(lin[0].x), y: num(lin[0].y) },
    p2: { x: num(lin[1].x), y: num(lin[1].y) },
  }
  var b, c, d, u1, u2, v1, v2
  v1 = { x: line.p2.x - line.p1.x, y: line.p2.y - line.p1.y }
  v2 = { x: line.p1.x - circle.center.x, y: line.p1.y - circle.center.y }
  b = v1.x * v2.x + v1.y * v2.y
  c = 2 * (v1.x * v1.x + v1.y * v1.y)
  b *= -2
  d = Math.sqrt(
    b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius),
  )
  if (isNaN(d)) {
    // no intercept
    return pt(real(NaN), real(NaN))
  }
  u1 = (b - d) / c // these represent the unit distance of point one and two on the line
  u2 = (b + d) / c
  const returned = {
    x: line.p1.x + v1.x * (index == 0 ? u1 : u2),
    y: line.p1.y + v1.y * (index == 0 ? u1 : u2),
  }
  return pt(real(returned.x ?? NaN), real(returned.y ?? NaN))
}

for (const b of ["line32", "ray32", "segment32", "vector32"] as const) {
  FN_INTERSECTION.add(
    ["circle32", b],
    "point32",
    (circ, lin) => intersect(circ.value, lin.value, 0),
    () => {
      throw new Error("no line-circle intersections on the GPU yet")
    },
  )
  FN_INTERSECTION.add(
    [b, "circle32"],
    "point32",
    (lin, circ) => intersect(circ.value, lin.value, 1),
    () => {
      throw new Error("no line-circle intersections on the GPU yet")
    },
  )
}
