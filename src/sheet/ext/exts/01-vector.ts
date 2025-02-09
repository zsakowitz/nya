import { each, type JsValue, type SPoint } from "../../../eval/ty"
import { unpt } from "../../../eval/ty/create"
import type { Paper } from "../../ui/paper"
import { defineHideable } from "../hideable"

export function drawVector(vector: [SPoint, SPoint], paper: Paper) {
  const o1 = paper.paperToCanvas(unpt(vector[0]))
  const o2 = paper.paperToCanvas(unpt(vector[1]))
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const { ctx, scale } = paper

  const dx = o2.x - o1.x
  const dy = o2.y - o1.y
  const nx = (14 * scale * dx) / Math.hypot(dx, dy)
  const ny = (14 * scale * dy) / Math.hypot(dx, dy)
  const ox = o2.x - nx
  const oy = o2.y - ny
  const w = 0.4

  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  ctx.strokeStyle = "#2d70b3"
  ctx.moveTo(o1.x, o1.y)
  ctx.lineTo(ox, oy)
  ctx.stroke()

  ctx.beginPath()
  ctx.fillStyle = "#2d70b3"
  ctx.moveTo(o2.x, o2.y)
  ctx.lineTo(ox + w * ny, oy - w * nx)
  ctx.lineTo(ox - w * ny, oy + w * nx)
  ctx.lineTo(o2.x, o2.y)
  ctx.stroke()
  ctx.fill()
}

export const EXT_VECTOR = defineHideable({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "vector") {
      return { value: value as JsValue<"vector"> }
    }
  },
  plot2d(data, paper) {
    for (const segment of each(data.value)) {
      drawVector(segment, paper)
    }
  },
  layer() {
    return 2
  },
})
