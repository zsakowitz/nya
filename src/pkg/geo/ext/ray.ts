import type { Point } from "../../../sheet/point"
import type { Cv } from "../../../sheet/ui/cv"
import type { Paper } from "../../../sheet/ui/paper"
import { createLineLikeExt } from "./line-like"

export function getRayBounds(
  cv: Paper | Cv,
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
): [Point, Point] | null {
  if (x1 == y1 && x2 == y2) {
    return null
  }

  const { xmin, w, ymin, h } = cv.bounds()

  if (x1 == x2) {
    if (y1 < y2) {
      if (y1 > ymin + h) {
        return null
      }
      return [
        cv.toCanvas({ x: x1, y: y1 }),
        cv.toCanvas({ x: x1, y: ymin + h }),
      ]
    }

    if (y1 < ymin) {
      return null
    }
    return [cv.toCanvas({ x: x1, y: y1 }), cv.toCanvas({ x: x1, y: ymin })]
  }

  const m = (y2 - y1) / (x2 - x1)

  if (x1 < x2) {
    if (x1 > xmin + w) {
      return null
    }

    return [
      cv.toCanvas({ x: x1, y: y1 }),
      cv.toCanvas({ x: xmin + w, y: m * (xmin + w - x1) + y1 }),
    ]
  }

  if (x1 < xmin) {
    return null
  }

  return [
    cv.toCanvas({ x: x1, y: y1 }),
    cv.toCanvas({ x: xmin, y: m * (xmin - x1) + y1 }),
  ]
}

export const EXT_RAY = createLineLikeExt("ray", (cv, p1, p2) => {
  const data = getRayBounds(cv, p1, p2)
  if (data) {
    const [o1, o2] = data
    return new Path2D(`M ${o1.x} ${o1.y} L ${o2.x} ${o2.y}`)
  } else {
    return null
  }
})
