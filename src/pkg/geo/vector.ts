import type { Point } from "../../sheet/point"
import type { Cv } from "../../sheet/ui/cv"
import { Size } from "../../sheet/ui/cv/consts"
import type { Paper } from "../../sheet/ui/paper"

export function vectorPath(
  cv: Paper | Cv,
  p1: Point,
  p2: Point,
  w = Size.VectorHead,
) {
  const o1 = cv.toCanvas(p1)
  const o2 = cv.toCanvas(p2)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const dx = o2.x - o1.x
  const dy = o2.y - o1.y
  const nx = (Size.VectorHead * cv.scale * dx) / Math.hypot(dx, dy)
  const ny = (Size.VectorHead * cv.scale * dy) / Math.hypot(dx, dy)
  const ox = o2.x - nx
  const oy = o2.y - ny

  return `M ${o1.x} ${o1.y} L ${o2.x} ${o2.y} M ${o2.x} ${o2.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`
}
