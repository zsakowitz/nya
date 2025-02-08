import { defineExt } from ".."
import { each, type JsValue, type SPoint } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"
import type { Paper } from "../../ui/paper"

export function drawPolygon(polygon: SPoint[], paper: Paper, closed: boolean) {
  const pts = polygon.map(({ x, y }) =>
    paper.paperToCanvas({ x: num(x), y: num(y) }),
  )
  if (pts.length == 0) return

  const { ctx, scale } = paper

  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  ctx.strokeStyle = "#2d70b3"
  ctx.fillStyle = "#2d70b340"
  ctx.moveTo(pts[0]!.x, pts[0]!.y)
  for (const pt of pts.slice(1)) {
    if (!(isFinite(pt.x) && isFinite(pt.y))) return
    ctx.lineTo(pt.x, pt.y)
  }
  if (closed) {
    ctx.lineTo(pts[0]!.x, pts[0]!.y)
  }
  ctx.fill()
  ctx.stroke()
}

export const EXT_POLYGON = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "polygon") {
      return { value: value as JsValue<"polygon"> }
    }
  },
  plot2d(data, paper) {
    for (const polygon of each(data.value)) {
      drawPolygon(polygon, paper, true)
    }
  },
  layer() {
    return 1
  },
})
