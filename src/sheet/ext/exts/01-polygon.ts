import { defineExt } from ".."
import { each, type JsValue } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"

export const EXT_POLYGON = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "polygon") {
      return { value: value as JsValue<"polygon"> }
    }
  },
  plot2d(data, paper) {
    for (const segment of each(data.value)) {
      const pts = segment.map(({ x, y }) =>
        paper.paperToCanvas({ x: num(x), y: num(y) }),
      )
      if (pts.length == 0) continue
      if (!pts.every((x) => isFinite(x.x) && isFinite(x.y))) continue

      const { ctx, scale } = paper

      ctx.beginPath()
      ctx.lineWidth = 3 * scale
      ctx.strokeStyle = "#2d70b3cc"
      ctx.fillStyle = "#2d70b340"
      ctx.moveTo(pts[0]!.x, pts[0]!.y)
      for (const pt of pts.slice(1)) {
        ctx.lineTo(pt.x, pt.y)
      }
      ctx.lineTo(pts[0]!.x, pts[0]!.y)
      ctx.fill()
      ctx.stroke()
    }
  },
  layer() {
    return 1
  },
})
