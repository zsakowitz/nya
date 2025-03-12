import type { SPoint } from "../eval/ty"
import { isZero } from "../eval/ty/check"
import { pt } from "../eval/ty/create"
import { add, div, sub } from "../eval/ty/ops"
import { hypot } from "../pkg/geo/fn/distance"

export interface Point {
  readonly x: number
  readonly y: number
}

function norm(pt: Point, distance = 1): Point {
  const hypot = Math.hypot(pt.x, pt.y)
  if (hypot == 0) return pt

  return {
    x: (distance * pt.x) / hypot,
    y: (distance * pt.y) / hypot,
  }
}

function normS(at: SPoint): SPoint {
  const denom = hypot(at)
  if (isZero(denom)) return at

  return pt(div(at.x, denom), div(at.y, denom))
}

export function normVector(from: Point, to: Point, distance = 1) {
  const n = norm({ x: to.x - from.x, y: to.y - from.y }, distance)

  return {
    x: from.x + n.x,
    y: from.y + n.y,
  }
}

export function normVectorS(from: SPoint, to: SPoint) {
  const n = normS(pt(sub(to.x, from.x), sub(to.y, from.y)))
  return pt(add(from.x, n.x), add(from.y, n.y))
}
