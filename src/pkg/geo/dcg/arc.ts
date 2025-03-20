import type { Val } from "../../../eval/ty"
import { NANPT, unpt } from "../../../eval/ty/create"
import { gliderOnLine } from "../../../eval/ty/info"
import type { Point } from "../../../sheet/point"
import { Cv } from "../../../sheet/ui/cv"
import { getRayBounds } from "../ext/ray"
import { intersectLineLineJs } from "../fn/intersection"

// Arcs are very strange, since they can exist in a massive variety of states.
// Most utilities for them are thus grouped into this file for ease of use.

export type Arc =
  // glider = undefined
  | { type: "invalid" }

  // glider at ≤0   = P1
  // glider at 0..1 = somewhere between P1 and P3 on the segment
  // glider at ≥1   = P3
  | { type: "segment"; p1: Point; p3: Point }

  // glider at ≤0   = from P1, move away from P3
  // glider at 0..1 = undefined
  // glider at ≥1   = from P3, move away from P1
  | { type: "tworay"; p1: Point; p3: Point }

  // glider at ≤0   = P1
  // glider at 0..1 = somewhere between P1 and P3 on the arc
  // glider at ≥1   = P3
  | {
      type: "circle"
      c: Point
      r: number
      a1: number
      a3: number
      p1: Point // c + r * sincos(a1)
      p3: Point // c + r * sincos(a3)
      swap: boolean
      large: boolean
    }

function computeArc(p1: Point, p2: Point, p3: Point): Arc {
  const { x: x1, y: y1 } = p1
  const { x: x2, y: y2 } = p2
  const { x: x3, y: y3 } = p3

  if (![x1, y1, x2, y2, x3, y3].every(isFinite)) {
    return { type: "invalid" }
  }

  const l1a: Point = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  const l1b: Point = { x: l1a.x - (y2 - y1), y: l1a.y + (x2 - x1) }
  const l2a: Point = { x: (x3 + x2) / 2, y: (y3 + y2) / 2 }
  const l2b: Point = { x: l2a.x - (y2 - y3), y: l2a.y + (x2 - x3) }

  const c = intersectLineLineJs([l1a, l1b], [l2a, l2b])
  const r = Math.hypot(c.x - x1, c.y - y1)
  const range = Math.max(
    ...[x1 - x2, x2 - x3, x3 - x1, y1 - y2, y2 - y3, y3 - y1].map(Math.abs),
  )

  // Due to floating-point arithmetic, collinearity checks can never be perfect.
  // This is a best-guess solution which works pretty well on most things, which
  // is all it needs to do.
  if (!([c.x, c.y, r].every(isFinite) && Math.abs(r) < 1e10 * range)) {
    const xmin = Math.min(x1, x3)
    const ymin = Math.min(y1, y3)
    const xmax = Math.max(x1, x3)
    const ymax = Math.max(y1, y3)

    return {
      type:
        xmin <= x2 && x2 <= xmax && ymin <= y2 && y2 <= ymax ?
          "segment"
        : "tworay",
      p1,
      p3,
    }
  }

  const mx = (p1.x + p3.x) / 2
  const my = (p1.y + p3.y) / 2

  const large =
    Math.hypot(p2.x - mx, p2.y - my) >= Math.hypot(p1.x - p3.x, p1.y - p3.y) / 2

  // This code properly orders `a1` and `a3` so that simple interpolations can be used for gliders
  let a1 = Math.atan2(p1.y - c.y, p1.x - c.x)
  let a2 = Math.atan2(p2.y - c.y, p2.x - c.x)
  let a3 = Math.atan2(p3.y - c.y, p3.x - c.x)

  if (!(Math.min(a1, a3) <= a2 && a2 <= Math.max(a1, a3))) {
    if (a3 > a1) {
      a3 -= 2 * Math.PI
    } else {
      a1 -= 2 * Math.PI
    }
  }

  return {
    type: "circle",
    c,
    r,
    a1,
    a3,
    p1,
    p3,
    large,
    swap: a1 > a3,
  }
}

export function computeArcVal(val: Val<"arc">): Arc {
  return computeArc(unpt(val[0]), unpt(val[1]), unpt(val[2]))
}

export type ArcPath =
  | { type: "invalid" }
  | { type: "circle"; p1: Point; r: Point; p3: Point; flags: string }
  | { type: "segment"; p1: Point; p3: Point }
  | { type: "tworay"; r1: [Point, Point] | null; r3: [Point, Point] | null }

export function arcPath(cv: Cv, arc: Arc): ArcPath {
  switch (arc.type) {
    case "invalid":
      return { type: "invalid" }
    case "segment":
      return {
        type: "segment",
        p1: cv.toCanvas(arc.p1),
        p3: cv.toCanvas(arc.p3),
      }
    case "tworay":
      return {
        type: "tworay",
        r1: getRayBounds(cv, arc.p1, {
          x: 2 * arc.p1.x - arc.p3.x,
          y: 2 * arc.p1.y - arc.p3.y,
        }),
        r3: getRayBounds(cv, arc.p3, {
          x: 2 * arc.p3.x - arc.p1.x,
          y: 2 * arc.p3.y - arc.p1.y,
        }),
      }
    case "circle":
      const delta = cv.toCanvasDelta({ x: arc.r, y: arc.r })
      return {
        type: "circle",
        p1: cv.toCanvas(arc.p1),
        p3: cv.toCanvas(arc.p3),
        r: delta,
        flags: `${+arc.large} ${+arc.swap}`,
      }
  }
}

export function glideArc(arc: Arc, at: number): Point {
  if (!isFinite(at) || arc.type == "invalid") {
    return NANPT
  }

  const t = arc.type == "tworay" ? at : Math.max(0, Math.min(1, at))

  if (arc.type == "circle") {
    const a = arc.a1 * (1 - t) + arc.a3 * t
    return {
      x: Math.cos(a) * arc.r + arc.c.x,
      y: Math.sin(a) * arc.r + arc.c.y,
    }
  } else {
    if (arc.type == "tworay" && 0 < at && at < 1) {
      return NANPT
    }
    return {
      x: arc.p1.x * (1 - t) + arc.p3.x * t,
      y: arc.p1.y * (1 - t) + arc.p3.y * t,
    }
  }
}

export function unglideArc(cv: Cv, arc: Arc, at: Point) {
  if (arc.type == "invalid") {
    return { value: 0, precision: 1 }
  }

  if (arc.type == "circle") {
    const a = Math.atan2(at.y - arc.c.y, at.x - arc.c.x)
    const t1 = (a - arc.a1) / (arc.a3 - arc.a1)
    const t2 = (a - 2 * Math.PI - arc.a1) / (arc.a3 - arc.a1)
    const t3 = (a + 2 * Math.PI - arc.a1) / (arc.a3 - arc.a1)
    return {
      value:
        0 <= t3 && t3 <= 1 ? t3
        : 0 <= t2 && t2 <= 1 ? t2
        : Math.max(0, Math.min(1, t1)),
      precision: 2 * Math.PI * cv.offsetDistance(at, arc.c),
    }
  }

  const { value: t, precision } = gliderOnLine(cv, [arc.p1, arc.p3], at)
  return {
    value:
      arc.type == "tworay" ?
        0 < t && t < 1 ?
          t < 0.5 ?
            0
          : 1
        : t
      : Math.max(0, Math.min(1, t)),
    precision,
  }
}

function crArc(
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  { x: x3, y: y3 }: Point,
): { c: Point; r: number } {
  if (![x1, y1, x2, y2, x3, y3].every(isFinite)) {
    return { c: NANPT, r: NaN }
  }

  const l1a: Point = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  const l1b: Point = { x: l1a.x - (y2 - y1), y: l1a.y + (x2 - x1) }
  const l2a: Point = { x: (x3 + x2) / 2, y: (y3 + y2) / 2 }
  const l2b: Point = { x: l2a.x - (y2 - y3), y: l2a.y + (x2 - x3) }

  const c = intersectLineLineJs([l1a, l1b], [l2a, l2b])
  const r = Math.hypot(c.x - x1, c.y - y1)

  return { c, r }
}

export function crArcVal(val: Val<"arc">) {
  return crArc(unpt(val[0]), unpt(val[1]), unpt(val[2]))
}

export function arcLength(arc: Arc) {
  switch (arc.type) {
    case "invalid":
      return NaN
    case "segment":
      return Math.hypot(arc.p1.x - arc.p3.x, arc.p1.y - arc.p3.y)
    case "tworay":
      return Infinity
    case "circle":
      return arc.r * Math.abs(arc.a1 - arc.a3)
  }
}
