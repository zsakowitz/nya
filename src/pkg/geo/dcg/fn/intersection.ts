import type { GlslContext } from "../../../../eval/lib/fn"
import type { GlslVal, SPoint, Tys, Val } from "../../../../eval/ty"
import { SNANPT, num, pt, real, rept } from "../../../../eval/ty/create"
import { div, mul, sub } from "../../../../eval/ty/ops"
import type { Point } from "../../../../sheet/point"
import { FN_INTERSECTION } from "../../../geo-point"
import { computeArcVal } from "../arc"

export function intersectLineLineJs(
  a: [Point, Point],
  b: [Point, Point],
): Point {
  const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = a
  const [{ x: x3, y: y3 }, { x: x4, y: y4 }] = b

  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  const x1y2 = x1 * y2
  const x2y1 = y1 * x2
  const x3y4 = x3 * y4
  const x4y3 = y3 * x4

  return {
    x: ((x1y2 - x2y1) * (x3 - x4) - (x1 - x2) * (x3y4 - x4y3)) / d,
    y: ((x1y2 - x2y1) * (y3 - y4) - (y1 - y2) * (x3y4 - x4y3)) / d,
  }
}

export function intersectSLineLineJs(
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: Val<"line">,
  [{ x: x3, y: y3 }, { x: x4, y: y4 }]: Val<"line">,
) {
  // (x1 - x2) (y3 - y4) - (y1 - y2) (x3 - x4)
  const d = sub(mul(sub(x1, x2), sub(y3, y4)), mul(sub(y1, y2), sub(x3, x4)))

  const x1y2 = mul(x1, y2)
  const x2y1 = mul(y1, x2)
  const x3y4 = mul(x3, y4)
  const x4y3 = mul(y3, x4)

  return pt(
    div(
      // (x1 y2 - y1 x2) (x3 - x4) - (x1 - x2) (x3 y4 - y3 x4)
      sub(
        // (x1 y2 - y1 x2) (x3 - x4)
        mul(sub(x1y2, x2y1), sub(x3, x4)),
        // (x1 - x2) (x3 y4 - y3 x4)
        mul(sub(x1, x2), sub(x3y4, x4y3)),
      ),
      d,
    ),

    div(
      // (x1 y2 - y1 x2) (y3 - y4) - (x1 - x2) (x3 y4 - y3 x4)
      sub(
        // (x1 y2 - y1 x2) (y3 - y4)
        mul(sub(x1y2, x2y1), sub(y3, y4)),
        // (y1 - y2) (x3 y4 - y3 x4)
        mul(sub(y1, y2), sub(x3y4, x4y3)),
      ),
      d,
    ),
  )
}

export function intersectLineLineGlsl(
  ctx: GlslContext,
  ar: GlslVal,
  br: GlslVal,
): string {
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

  const d = `(${x1} - ${x2}) * (${y3} - ${y4}) - (${y1} - ${y2}) * (${x3} - ${x4})`

  const x1y2 = `(${x1} * ${y2})`
  const x2y1 = `(${y1} * ${x2})`
  const x3y4 = `(${x3} * ${y4})`
  const x4y3 = `(${y3} * ${x4})`

  return `(vec2(
  (${x1y2} - ${x2y1}) * (${x3} - ${x4}) - (${x1} - ${x2}) * (${x3y4} - ${x4y3}),
  (${x1y2} - ${x2y1}) * (${y3} - ${y4}) - (${y1} - ${y2}) * (${x3y4} - ${x4y3})
) / (${d}))`
}

// line-line
for (const a of ["segment", "ray", "line"] as const) {
  for (const b of ["segment", "ray", "line"] as const) {
    FN_INTERSECTION.add(
      [a, b],
      "point32",
      (a, b) => intersectSLineLineJs(a.value, b.value),
      intersectLineLineGlsl,
    )
  }
}

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
    return SNANPT
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
  const b = ctx.cached("r32", `(-2. * (${v1}.x * ${v2}.x + ${v1}.y * ${v2}.y))`)
  const c = ctx.cached("r32", `(2. * (${v1}.x * ${v1}.x + ${v2}.y * ${v2}.y))`)
  const d = ctx.cached(
    "r32",
    `sqrt(${b}*${b} - 2.0*${c}*(${v2}.x*${v2}.x+${v2}.y*${v2}.y-${r}*${r}))`,
  )
  return `(vec2(${x1},${y1}) + ${v1} * ((${b}${index == -1 ? "-" : "+"}${d})/${c}))`
}

function lineArcJs(ac: Tys["arc"], lin: Tys["line"], index: -1 | 1): SPoint {
  const arc = computeArcVal(ac)
  switch (arc.type) {
    case "invalid":
      return SNANPT
    case "segment":
    case "tworay":
      return intersectSLineLineJs([rept(arc.p1), rept(arc.p3)], lin)
    case "circle":
      return lineCircleJs(
        {
          center: rept(arc.c),
          radius: real(arc.r),
        },
        lin,
        arc.swap ? index : (-index as -1 | 1),
      )
  }
}

function circleCircleJs(
  ar: Tys["circle"],
  br: Tys["circle"],
  swap: boolean,
): SPoint {
  if (swap) {
    ;[br, ar] = [ar, br]
  }

  const x0 = num(ar.center.x)
  const y0 = num(ar.center.y)
  const r0 = num(ar.radius)

  const x1 = num(br.center.x)
  const y1 = num(br.center.y)
  const r1 = num(br.radius)

  // Calculate the distance between the centers of the circles
  const dx = x1 - x0
  const dy = y1 - y0
  const d = Math.sqrt(dx * dx + dy * dy)

  // Check for special cases
  if (d > r0 + r1) {
    // Circles do not intersect
    return SNANPT
  }
  if (d < Math.abs(r0 - r1)) {
    // One circle is contained within the other
    return SNANPT
  }
  if (d === 0 && r0 === r1) {
    // Circles are the same
    return SNANPT
  }

  // Calculate the intersection points
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d)
  const h = Math.sqrt(r0 * r0 - a * a)
  const rx = -dy * (h / d)
  const ry = dx * (h / d)

  return pt(real(x0 + a * (dx / d) + rx), real(y0 + a * (dy / d) + ry))
}

// line-circle
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

  FN_INTERSECTION.add(
    ["arc", b],
    "point32",
    (a, b) => lineArcJs(a.value, b.value, 1),
    () => {
      // TODO:
      throw new Error(
        "Cannot compute intersections involving an arc in shaders yet.",
      )
    },
  )
  FN_INTERSECTION.add(
    [b, "arc"],
    "point32",
    (a, b) => lineArcJs(b.value, a.value, -1),
    () => {
      // TODO:
      throw new Error(
        "Cannot compute intersections involving an arc in shaders yet.",
      )
    },
  )
}

// circle-circle
FN_INTERSECTION.add(
  ["circle", "circle"],
  "point32",
  (ar, br) => circleCircleJs(ar.value, br.value, false),
  () => {
    // TODO:
    throw new Error(
      "Cannot compute intersections between two circles in shaders yet.",
    )
  },
)

FN_INTERSECTION.add(
  ["circle", "arc"],
  "point32",
  (ar, br) => {
    const b = computeArcVal(br.value)
    switch (b.type) {
      case "invalid":
        return SNANPT
      case "segment":
      case "tworay":
        return lineCircleJs(ar.value, [rept(b.p1), rept(b.p3)], 1)
      case "circle":
        return circleCircleJs(
          ar.value,
          {
            center: rept(b.c),
            radius: real(b.r),
          },
          b.swap,
        )
    }
  },
  () => {
    // TODO:
    throw new Error(
      "Cannot compute intersections involving arcs in shaders yet.",
    )
  },
)

FN_INTERSECTION.add(
  ["arc", "circle"],
  "point32",
  (ar, br) => {
    const b = computeArcVal(ar.value)
    switch (b.type) {
      case "invalid":
        return SNANPT
      case "segment":
      case "tworay":
        return lineCircleJs(br.value, [rept(b.p1), rept(b.p3)], -1)
      case "circle":
        return circleCircleJs(
          br.value,
          {
            center: rept(b.c),
            radius: real(b.r),
          },
          !b.swap,
        )
    }
  },
  () => {
    // TODO:
    throw new Error(
      "Cannot compute intersections involving arcs in shaders yet.",
    )
  },
)

FN_INTERSECTION.add(
  ["arc", "arc"],
  "point32",
  (ar, br) => {
    const a = computeArcVal(ar.value)
    const b = computeArcVal(br.value)
    if (a.type == "invalid" || b.type == "invalid") {
      return SNANPT
    }
    if (a.type == "circle") {
      const ac = { center: rept(a.c), radius: real(a.r) }
      if (b.type == "circle") {
        const bc = { center: rept(b.c), radius: real(b.r) }
        return circleCircleJs(bc, ac, a.swap != b.swap)
      } else {
        return lineCircleJs(ac, [rept(b.p1), rept(b.p3)], a.swap ? -1 : 1)
      }
    } else {
      if (b.type == "circle") {
        const bc = { center: rept(b.c), radius: real(b.r) }
        return lineCircleJs(bc, [rept(b.p1), rept(b.p3)], b.swap ? 1 : -1)
      } else {
        return intersectSLineLineJs(
          [rept(a.p1), rept(b.p3)],
          [rept(b.p1), rept(b.p3)],
        )
      }
    }
  },
  () => {
    // TODO:
    throw new Error(
      "Cannot compute intersections involving arcs in shaders yet.",
    )
  },
)
