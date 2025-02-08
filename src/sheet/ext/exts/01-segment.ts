import { defineExt } from ".."
import { each, type JsValue, type SPoint } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"
import type { Paper } from "../../ui/paper"

export function drawSegment(segment: [SPoint, SPoint], paper: Paper) {
  const x1 = num(segment[0].x)
  const y1 = num(segment[0].y)
  const x2 = num(segment[1].x)
  const y2 = num(segment[1].y)

  const o1 = paper.paperToCanvas({ x: x1, y: y1 })
  const o2 = paper.paperToCanvas({ x: x2, y: y2 })
  if (!(isFinite(o1.x) && isFinite(o1.y) && isFinite(o2.x) && isFinite(o2.y))) {
    return
  }

  const { ctx, scale } = paper

  ctx.beginPath()
  ctx.lineWidth = 3 * scale
  ctx.strokeStyle = "#2d70b3"
  ctx.moveTo(o1.x, o1.y)
  ctx.lineTo(o2.x, o2.y)
  ctx.stroke()
}

export const EXT_SEGMENT = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "segment") {
      return { value: value as JsValue<"segment"> }
    }
  },
  plot2d(data, paper) {
    for (const segment of each(data.value)) {
      drawSegment(segment, paper)
    }
  },
  layer() {
    return 2
  },
})
