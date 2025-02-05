import { defineExt } from ".."
import { each, type JsValue } from "../../../eval/ty"
import { num } from "../../../eval/ty/create"

export const EXT_CIRCLE = defineExt({
  data(expr) {
    const value = expr.js?.value

    if (value && value.type == "circle32") {
      return { value: value as JsValue<"circle32"> }
    }
  },
  plot2d(data, paper) {
    for (const { center, radius } of each(data.value)) {
      const x = num(center.x)
      const y = num(center.y)
      const r = num(radius)

      if (!(isFinite(x) && isFinite(y) && isFinite(r) && r > 0)) continue

      const pt = paper.paperToCanvas({ x, y })
      const w = (r / paper.bounds().w) * paper.el.width
      const h = (r / paper.bounds().h) * paper.el.height
      const { ctx, scale } = paper

      ctx.beginPath()
      ctx.lineWidth = 3 * scale
      ctx.strokeStyle = "#388c46cc"
      ctx.ellipse(pt.x, pt.y, w, h, 0, 0, 2 * Math.PI)
      ctx.stroke()
    }
  },
  layer() {
    return 1
  },
})
