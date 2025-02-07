import { defineExt } from ".."
import { each, type JsValue } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"

export const EXT_VECTOR = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "vector") {
      return { value: value as JsValue<"vector"> }
    }
  },
  plot2d(data, paper) {
    for (const segment of each(data.value)) {
      const x1 = num(segment[0].x)
      const y1 = num(segment[0].y)
      const x2 = num(segment[1].x)
      const y2 = num(segment[1].y)

      if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)))
        continue

      const o1 = paper.paperToCanvas({ x: x1, y: y1 })
      const o2 = paper.paperToCanvas({ x: x2, y: y2 })
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
      ctx.strokeStyle = "#2d70b3cc"
      ctx.moveTo(o1.x, o1.y)
      ctx.lineTo(ox, oy)
      ctx.stroke()

      ctx.beginPath()
      ctx.fillStyle = "#2d70b3cc"
      ctx.moveTo(o2.x, o2.y)
      ctx.lineTo(ox + w * ny, oy - w * nx)
      ctx.lineTo(ox - w * ny, oy + w * nx)
      ctx.lineTo(o2.x, o2.y)
      ctx.fill()
    }
  },
  layer() {
    return 1
  },
})
