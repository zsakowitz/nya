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
      a3: number
      p1: Point // c + r * sincos(a1)
      p2: Point
      p3: Point // c + r * sincos(a3)
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

  const a1: Point = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  const a2: Point = { x: a1.x - (y2 - y1), y: a1.y + (x2 - x1) }
  const b1: Point = { x: (x3 + x2) / 2, y: (y3 + y2) / 2 }
  const b2: Point = { x: b1.x - (y2 - y3), y: b1.y + (x2 - x3) }

  const c = intersectLineLineJs([a1, a2], [b1, b2])
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

  return {
    type: "circle",
    c,
    r,
    a1: Math.atan2(p1.x - c.x, p1.y - c.y),
    a3: Math.atan2(p3.x - c.x, p3.y - c.y),
    p1,
    p2,
    p3,
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
      const mx = (arc.p1.x + arc.p3.x) / 2
      const my = (arc.p1.y + arc.p3.y) / 2
      const p2nrm = {
        x: mx + (arc.p3.y - arc.p1.y),
        y: my - (arc.p3.x - arc.p1.x),
      }
      const p2rev = {
        x: mx - (arc.p3.y - arc.p1.y),
        y: my + (arc.p3.x - arc.p1.x),
      }
      return {
        type: "circle",
        p1: paper.toOffset(arc.p1),
        p3: paper.toOffset(arc.p3),
        r: delta,
        flags: `${+(
          Math.hypot(arc.p2.x - mx, arc.p2.y - my) >=
          Math.hypot(arc.p1.x - arc.p3.x, arc.p1.y - arc.p3.y) / 2
        )} ${+(
          Math.hypot(arc.p2.x - p2nrm.x, arc.p2.y - p2nrm.y) >=
          Math.hypot(arc.p2.x - p2rev.x, arc.p2.y - p2rev.y)
        )}`,
      }
  }
}
