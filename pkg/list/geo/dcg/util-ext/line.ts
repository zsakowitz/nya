import { px, type Point } from "@/lib/point"
import type { Cv } from "@/sheet/ui/cv"
import { createLineLikeExt } from "./line-like"

export function getLineBounds(
  cv: Cv,
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
): [Point, Point] {
  const { xmin, w, ymin, h } = cv.bounds()

  if (x1 == x2) {
    return [cv.toCanvas(px(x1, ymin)), cv.toCanvas(px(x1, ymin + h))]
  }

  const m = (y2 - y1) / (x2 - x1)

  return [
    cv.toCanvas(px(xmin, m * (xmin - x1) + y1)),
    cv.toCanvas(px(xmin + w, m * (xmin + w - x1) + y1)),
  ]
}

export const EXT_LINE = createLineLikeExt("line", (cv, p1, p2) => {
  const [o1, o2] = getLineBounds(cv, p1, p2)
  return new Path2D(`M ${o1.x} ${o1.y} L ${o2.x} ${o2.y}`)
})
