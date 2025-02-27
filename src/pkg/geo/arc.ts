import type { Paper, Point } from "../../sheet/ui/paper"
import { getRayBounds } from "./ext/ray"
import { intersectLineLineJs } from "./fn/intersection"

// Arcs are very strange, since they can exist in a massive variety of states.
// Most utilities for them are thus grouped into this file for ease of use.

export type Arc =
  // glider = undefined
  | { type: "invalid" }

  // glider at ≤0   = P1
  // glider at 0..1 = somewhere between P1 and P3 on the arc
  // glider at ≥1   = P3
  | {
      type: "circle"
      c: Point
      r: number
      a1: number
      a2: number
      a3: number
      p1: Point // c + r * sincos(a1)
      p3: Point // c + r * sincos(a3)
      swap: boolean
      large: boolean
    }

  // glider at ≤0   = P1
  // glider at 0..1 = somewhere between P1 and P3 on the segment
  // glider at ≥1   = P3
  | { type: "segment"; p1: Point; p3: Point }

  // glider at ≤0   = from P1, move away from P3
  // glider at 0..1 = undefined
  // glider at ≥1   = from P3, move away from P1
  | { type: "tworay"; p1: Point; p3: Point }

export function computeArc(p1: Point, p2: Point, p3: Point): Arc {
  const { x: x1, y: y1 } = p1
  const { x: x2, y: y2 } = p2
  const { x: x3, y: y3 } = p3

  if (![x1, y1, x2, y2, x3, y3].every(isFinite)) {
    return { type: "invalid" }
  }

  // check for collinearity

  const l1a: Point = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  const l1b: Point = { x: l1a.x - (y2 - y1), y: l1a.y + (x2 - x1) }
  const l2a: Point = { x: (x3 + x2) / 2, y: (y3 + y2) / 2 }
  const l2b: Point = { x: l2a.x - (y2 - y3), y: l2a.y + (x2 - x3) }

  const c = intersectLineLineJs([l1a, l1b], [l2a, l2b])
  const r = Math.hypot(c.x - x1, c.y - y1)
  if (!(isFinite(c.x) && isFinite(c.y) && isFinite(r))) {
    if (Math.abs((y2 - y1) * (x1 - x2) - (y3 - y2) * (y2 - y1)) < 1e-8) {
      const direct = Math.hypot(x1 - x3, y1 - y3)

      return {
        type:
          (
            Math.hypot(x1 - x2, y1 - y2) > direct ||
            Math.hypot(x3 - x2, y3 - y2) > direct
          ) ?
            "tworay"
          : "segment",
        p1,
        p3,
      }
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
    a2,
    a3,
    p1,
    p3,
    large,
    swap: a1 > a3,
  }
}

export type ArcPath =
  | { type: "invalid" }
  | { type: "circle"; p1: Point; r: Point; p3: Point; flags: string }
  | { type: "segment"; p1: Point; p3: Point }
  | { type: "tworay"; r1: [Point, Point] | null; r3: [Point, Point] | null }

export function arcPath(paper: Paper, arc: Arc): ArcPath {
  switch (arc.type) {
    case "invalid":
      return { type: "invalid" }
    case "segment":
      return {
        type: "segment",
        p1: paper.toOffset(arc.p1),
        p3: paper.toOffset(arc.p3),
      }
    case "tworay":
      return {
        type: "tworay",
        r1: getRayBounds(paper, arc.p1, {
          x: 2 * arc.p1.x - arc.p3.x,
          y: 2 * arc.p1.y - arc.p3.y,
        }),
        r3: getRayBounds(paper, arc.p3, {
          x: 2 * arc.p3.x - arc.p1.x,
          y: 2 * arc.p3.y - arc.p1.y,
        }),
      }
    case "circle":
      const delta = paper.toOffsetDelta({ x: arc.r, y: arc.r })
      return {
        type: "circle",
        p1: paper.toOffset(arc.p1),
        p3: paper.toOffset(arc.p3),
        r: delta,
        flags: `${+arc.large} ${+arc.swap}`,
      }
  }
}

export function glideArc(arc: Arc, at: number): Point {
  if (!isFinite(at) || arc.type == "invalid") {
    return { x: NaN, y: NaN }
  }

  const t = arc.type == "tworay" ? at : Math.max(0, Math.min(1, at))

  switch (arc.type) {
    case "segment":
    case "tworay":
      if (arc.type == "tworay" && 0 < at && at < 1) {
        return { x: NaN, y: NaN }
      }
      return {
        x: arc.p1.x * (1 - t) + arc.p3.x * t,
        y: arc.p1.y * (1 - t) + arc.p3.y * t,
      }
    case "circle":
      const a = arc.a1 * (1 - t) + arc.a3 * t
      return {
        x: Math.cos(a) * arc.r + arc.c.x,
        y: Math.sin(a) * arc.r + arc.c.y,
      }
  }
}
