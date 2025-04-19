export interface Point {
  readonly x: number
  readonly y: number
}

export function norm(pt: Point, distance = 1): Point {
  const hypot = Math.hypot(pt.x, pt.y)
  if (hypot == 0) return pt

  return {
    x: (distance * pt.x) / hypot,
    y: (distance * pt.y) / hypot,
  }
}

export function normVector(from: Point, to: Point, distance = 1) {
  const n = norm({ x: to.x - from.x, y: to.y - from.y }, distance)

  return {
    x: from.x + n.x,
    y: from.y + n.y,
  }
}
