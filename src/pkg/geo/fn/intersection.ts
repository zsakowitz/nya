/// <reference path="../../geo-point.ts" />
/// <reference path="../index.ts" />

import type { GlslContext } from "../../../eval/lib/fn"
import type { GlslVal, Tys, Val } from "../../../eval/ty"
import { num, pt, real } from "../../../eval/ty/create"
import { div, mul, sub } from "../../../eval/ty/ops"
import { FN_INTERSECTION } from "../../geo-point"

function js(
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: Val<"line">,
  [{ x: x3, y: y3 }, { x: x4, y: y4 }]: Val<"line">,
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

// line-line
for (const a of ["segment", "ray", "line"] as const) {
  for (const b of ["segment", "ray", "line"] as const) {
    FN_INTERSECTION.add([a, b], "point32", (a, b) => js(a.value, b.value), glsl)
  }
}

// line-circle
{
  function lineCircleJs(circ: Tys["circle"], lin: Tys["line"], index: -1 | 1) {
    // https://stackoverflow.com/a/37225895
    const cx = num(circ.center.x)
    const cy = num(circ.center.y)
    const r = num(circ.radius)
    const x1 = num(lin[0].x)
    const y1 = num(lin[0].y)
    const x2 = num(lin[1].x)
    const y2 = num(lin[1].y)
    const v1 = { x: x2 - x1, y: y2 - y1 }
    const v2 = { x: x1 - cx, y: y1 - cy }
    const b = -2 * (v1.x * v2.x + v1.y * v2.y)
    const c = 2 * (v1.x * v1.x + v1.y * v1.y)
    const d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - r * r))
    if (isNaN(d)) {
      return pt(real(NaN), real(NaN))
    }
    const u1 = (b + index * d) / c
    const returned = { x: x1 + v1.x * u1, y: y1 + v1.y * u1 }
    return pt(real(returned.x), real(returned.y))
  }

  function lineCircleGlsl(
    ctx: GlslContext,
    circ: string,
    lin: string,
    index: -1 | 1,
  ) {
    // https://stackoverflow.com/a/37225895
    const cx = `${circ}.x`
    const cy = `${circ}.y`
    const r = `${circ}.z`
    const x1 = `${lin}.x`
    const y1 = `${lin}.y`
    const x2 = `${lin}.z`
    const y2 = `${lin}.w`
    const v1 = ctx.cached("point32", `vec2(${x2}-${x1},${y2}-${y1})`)
    const v2 = ctx.cached("point32", `vec2(${x1}-${cx}, ${y1}-${cy})`)
    const b = ctx.cached(
      "r32",
      `(-2. * (${v1}.x * ${v2}.x + ${v1}.y * ${v2}.y))`,
    )
    const c = ctx.cached(
      "r32",
      `(2. * (${v1}.x * ${v1}.x + ${v2}.y * ${v2}.y))`,
    )
    const d = ctx.cached(
      "r32",
      `sqrt(${b}*${b} - 2.0*${c}*(${v2}.x*${v2}.x+${v2}.y*${v2}.y-${r}*${r}))`,
    )
    return `(vec2(${x1},${y1}) + ${v1} * ((${b}${index == -1 ? "-" : "+"}${d})/${c}))`
  }

  for (const b of ["segment", "ray", "line"] as const) {
    FN_INTERSECTION.add(
      ["circle", b],
      "point32",
      (a, b) => lineCircleJs(a.value, b.value, 1),
      (ctx, a, b) => lineCircleGlsl(ctx, ctx.cache(a), ctx.cache(b), 1),
    )
    FN_INTERSECTION.add(
      [b, "circle"],
      "point32",
      (a, b) => lineCircleJs(b.value, a.value, -1),
      (ctx, a, b) => lineCircleGlsl(ctx, ctx.cache(b), ctx.cache(a), -1),
    )
  }
}

// circle-circle
FN_INTERSECTION.add(
  ["circle", "circle"],
  "point32",
  (ar, br) => {
    // From Google's AI overview; I'm not sure of the original source

    const x0 = num(ar.value.center.x)
    const y0 = num(ar.value.center.y)
    const r0 = num(ar.value.radius)

    const x1 = num(br.value.center.x)
    const y1 = num(br.value.center.y)
    const r1 = num(br.value.radius)

    // Calculate the distance between the centers of the circles
    const dx = x1 - x0
    const dy = y1 - y0
    const d = Math.sqrt(dx * dx + dy * dy)

    // Check for special cases
    if (d > r0 + r1) {
      // Circles do not intersect
      return pt(real(NaN), real(NaN))
    }
    if (d < Math.abs(r0 - r1)) {
      // One circle is contained within the other
      return pt(real(NaN), real(NaN))
    }
    if (d === 0 && r0 === r1) {
      // Circles are the same
      return pt(real(NaN), real(NaN))
    }

    // Calculate the intersection points
    const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d)
    const h = Math.sqrt(r0 * r0 - a * a)
    const rx = -dy * (h / d)
    const ry = dx * (h / d)

    return pt(real(x0 + a * (dx / d) + rx), real(y0 + a * (dy / d) + ry))
  },
  () => {
    throw new Error("Cannot compute circle intersections in shaders yet.")
  },
)
