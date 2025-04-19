import type { Cv } from "@/sheet/ui/cv"
import { Size } from "@/sheet/ui/cv/consts"

export function vectorPath(
  cv: Cv,
  p1: Point,
  p2: Point,
  size: number = Size.VectorHead,
) {
  const o1 = cv.toCanvas(p1)
  const o2 = cv.toCanvas(p2)
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const dx = o2.x - o1.x
  const dy = o2.y - o1.y
  const nx = (size * cv.scale * dx) / Math.hypot(dx, dy)
  const ny = (size * cv.scale * dy) / Math.hypot(dx, dy)
  const ox = o2.x - nx
  const oy = o2.y - ny
  const w = Size.VectorWidthRatio

  return `M ${o1.x} ${o1.y} L ${o2.x} ${o2.y} M ${o2.x} ${o2.y} L ${ox + w * ny} ${oy - w * nx} L ${ox - w * ny} ${oy + w * nx} Z`
}
