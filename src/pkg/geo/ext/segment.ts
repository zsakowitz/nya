import { createLineLikeExt } from "./line-like"

export const EXT_SEGMENT = createLineLikeExt("segment", (cv, p1, p2) => {
  const o1 = cv.toCanvas(p1)
  const o2 = cv.toCanvas(p2)
  return new Path2D(`M ${o1.x} ${o1.y} L ${o2.x} ${o2.y}`)
})
