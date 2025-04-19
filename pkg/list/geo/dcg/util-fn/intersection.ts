import type { GlslContext } from "@/eval/lib/fn"
import type { GlslVal, Tys, Val } from "@/eval/ty"
import { px } from "@/lib/point"
import { pt, ptint, ptnan, type SPoint } from "@/lib/point"
import { frac, int } from "@/lib/real"
import { FN_INTERSECTION } from "../../point"
import { computeArcVal } from "../util-arc"

export function intersectSLineLineJs(
  [{ x: x1, y: y1 }, { x: x2, y: y2 }]: Val<"line">,
  [{ x: x3, y: y3 }, { x: x4, y: y4 }]: Val<"line">,
) {
  // (x1 - x2) (y3 - y4) - (y1 - y2) (x3 - x4)
  const d = x1
    .sub(x2)
    .mul(y3.sub(y4))
    .sub(y1.sub(y2).mul(x3.sub(x4)))

  const x1y2 = x1.mul(y2)
  const x2y1 = y1.mul(x2)
  const x3y4 = x3.mul(y4)
  const x4y3 = y3.mul(x4)

  const t1 = x1y2.sub(x2y1).mul(x3.sub(x4)) // (x1 y2 - y1 x2) (x3 - x4)
  const t2 = x1y2.sub(x2y1).mul(y3.sub(y4)) // (x1 y2 - y1 x2) (y3 - y4)
  const t3 = y1.sub(y2).mul(x3y4.sub(x4y3)) // (y1 - y2) (x3 y4 - y3 x4)
  const t4 = x1.sub(x2).mul(x3y4.sub(x4y3)) // (x1 - x2) (x3 y4 - y3 x4)

  return pt([t1.sub(t4), t2.sub(t3)]).divR(d)
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
      a == "line" && b == "line" ?
        String.raw`\operatorname{intersection}\left(\operatorname{line}\left(\left(2,3\right),\left(4,-5\right)\right),\operatorname{line}\left(\left(1,9\right),\left(5,0\right)\right)\right)=(-\\frac1{7},\\frac{81}7)`
      : [],
    )
  }
}

function lineCircleJs(circ: Tys["circle"], lin: Tys["line"], index: -1 | 1) {
  // https://stackoverflow.com/a/37225895
  const cx = circ.center.x.num()
  const cy = circ.center.y.num()
  const r = circ.radius.num()
  const x1 = lin[0].x.num()
  const y1 = lin[0].y.num()
  const x2 = lin[1].x.num()
  const y2 = lin[1].y.num()
  const v1 = px(x2 - x1, y2 - y1)
  const v2 = px(x1 - cx, y1 - cy)
  const b = -2 * (v1.x * v2.x + v1.y * v2.y)
  const c = 2 * (v1.x * v1.x + v1.y * v1.y)
  const d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - r * r))
  if (isNaN(d)) {
    return ptnan(2)
  }
  const u1 = (b + index * d) / c
  const returned = px(x1 + v1.x * u1, y1 + v1.y * u1)
  return returned.s()
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
      return ptnan(2)
    case "segment":
    case "tworay":
      return intersectSLineLineJs([arc.p1.s(), arc.p3.s()], lin)
    case "circle":
      return lineCircleJs(
        {
          center: arc.c.s(),
          radius: int(arc.r),
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

  const x0 = ar.center.x.num()
  const y0 = ar.center.y.num()
  const r0 = ar.radius.num()

  const x1 = br.center.x.num()
  const y1 = br.center.y.num()
  const r1 = br.radius.num()

  // Calculate the distance between the centers of the circles
  const dx = x1 - x0
  const dy = y1 - y0
  const d = Math.sqrt(dx * dx + dy * dy)

  // Check for special cases
  if (d > r0 + r1) {
    // Circles do not intersect
    return ptnan(2)
  }
  if (d < Math.abs(r0 - r1)) {
    // One circle is contained within the other
    return ptnan(2)
  }
  if (d === 0 && r0 === r1) {
    // Circles are the same
    return ptnan(2)
  }

  // Calculate the intersection points
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d)
  const h = Math.sqrt(r0 * r0 - a * a)
  const rx = -dy * (h / d)
  const ry = dx * (h / d)

  return ptint([x0, y0])
    .add(ptint([rx, ry]))
    .add(ptint([dx, dy]).mulR(frac(a, d)))
}

// line-circle
for (const b of ["segment", "ray", "line"] as const) {
  FN_INTERSECTION.add(
    ["circle", b],
    "point32",
    (a, b) => lineCircleJs(a.value, b.value, 1),
    (ctx, a, b) => lineCircleGlsl(ctx, ctx.cache(a), ctx.cache(b), 1),
    [],
  )
  FN_INTERSECTION.add(
    [b, "circle"],
    "point32",
    (a, b) => lineCircleJs(b.value, a.value, -1),
    (ctx, a, b) => lineCircleGlsl(ctx, ctx.cache(b), ctx.cache(a), -1),
    b == "line" ?
      String.raw`\operatorname{intersection}\left(\operatorname{line}\left(\left(2,3\right),\left(4,-5\right)\right),\operatorname{circle}\left(\left(1,9\right),\left(5,0\right)\right)\right)≈(-1.8564,18.4256)`
    : [],
  )
}

// line-arc
for (const b of ["segment", "ray", "line"] as const) {
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
    [],
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
    b == "line" ?
      String.raw`\operatorname{intersection}\left(\operatorname{line}\left(\left(5,1\right),\left(4,2\right)\right),\operatorname{arc}\left(\left(2,3\right),\left(5,-1\right),\left(4,6\right)\right)\right)≈(2.1684,3.8316)`
    : [],
  )
}

const A = String.raw`\operatorname{arc}\left(\left(2,3\right),\left(5,-1\right),\left(4,6\right)\right)`
const A2 = String.raw`\operatorname{arc}\left(\left(5,15\right),\left(6,10\right),\left(5,-5\right)\right)`
const B = String.raw`\operatorname{circle}\left(\left(3,3\right),4\right)`
const B2 = String.raw`\operatorname{circle}\left(\left(5,2\right),2\right)`

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
  `intersection(${B},${B2})≈(6.9568,2.4136)`,
)

FN_INTERSECTION.add(
  ["circle", "arc"],
  "point32",
  (ar, br) => {
    const b = computeArcVal(br.value)
    switch (b.type) {
      case "invalid":
        return ptnan(2)
      case "segment":
      case "tworay":
        return lineCircleJs(ar.value, [b.p1.s(), b.p3.s()], 1)
      case "circle":
        return circleCircleJs(
          ar.value,
          {
            center: b.c.s(),
            radius: int(b.r),
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
  `intersection(${B},${A})≈(5.1415,6.3784)`,
)

FN_INTERSECTION.add(
  ["arc", "circle"],
  "point32",
  (ar, br) => {
    const b = computeArcVal(ar.value)
    switch (b.type) {
      case "invalid":
        return ptnan(2)
      case "segment":
      case "tworay":
        return lineCircleJs(br.value, [b.p1.s(), b.p3.s()], -1)
      case "circle":
        return circleCircleJs(
          br.value,
          {
            center: b.c.s(),
            radius: int(b.r),
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
  `intersection(${A},${B})≈(4.2943,-0.7848)`,
)

FN_INTERSECTION.add(
  ["arc", "arc"],
  "point32",
  (ar, br) => {
    const a = computeArcVal(ar.value)
    const b = computeArcVal(br.value)
    if (a.type == "invalid" || b.type == "invalid") {
      return ptnan(2)
    }
    if (a.type == "circle") {
      const ac = { center: a.c.s(), radius: int(a.r) }
      if (b.type == "circle") {
        const bc = { center: b.c.s(), radius: int(b.r) }
        return circleCircleJs(bc, ac, a.swap != b.swap)
      } else {
        return lineCircleJs(ac, [b.p1.s(), b.p3.s()], a.swap ? -1 : 1)
      }
    } else {
      if (b.type == "circle") {
        const bc = { center: b.c.s(), radius: int(b.r) }
        return lineCircleJs(bc, [b.p1.s(), b.p3.s()], b.swap ? 1 : -1)
      } else {
        return intersectSLineLineJs([a.p1.s(), b.p3.s()], [b.p1.s(), b.p3.s()])
      }
    }
  },
  () => {
    // TODO:
    throw new Error(
      "Cannot compute intersections involving arcs in shaders yet.",
    )
  },
  `intersection(${A},${A2})≈(5.8435,-1.0712)`,
)
